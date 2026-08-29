import os
import re
import time
import socket
import logging
import requests
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List, Type, Callable, Tuple, Generator, Union
from pydantic import BaseModel

logger = logging.getLogger("compute_backends")

class NormalizedResponse(BaseModel):
    success: bool
    content: str
    model: str
    tokens_generated: int = 0
    duration_seconds: float = 0.0
    tokens_per_second: float = 0.0
    backend_type: str  # e.g. "laptop_gpu" | "vllm_cluster"
    error: Optional[str] = None
    raw_response: Optional[Dict[str, Any]] = None

class ComputeBackend(ABC):
    @abstractmethod
    def generate(self, prompt: str, max_tokens: int = 512, temperature: float = 0.2, **kwargs) -> NormalizedResponse:
        pass

    @abstractmethod
    def is_online(self) -> bool:
        pass

class ComputeBackendRegistry:
    """
    Open registry for compute backends.
    Allows zero-refactor scaling to new execution fabrics (Ollama, vLLM, Ray, TGI)
    via decorator registration @register_compute_backend.
    """
    def __init__(self):
        self._backends: Dict[str, Type[ComputeBackend]] = {}

    def register(self, name: str, backend_cls: Type[ComputeBackend]):
        self._backends[name.lower()] = backend_cls
        logger.info(f"Registered compute backend: '{name}' -> {backend_cls.__name__}")
        return backend_cls

    def get_backend_class(self, name: str) -> Optional[Type[ComputeBackend]]:
        return self._backends.get(name.lower())

    def list_registered_backends(self) -> List[str]:
        return list(self._backends.keys())

compute_backend_registry = ComputeBackendRegistry()

def register_compute_backend(name: str):
    """Decorator to register a ComputeBackend class with the global registry."""
    def decorator(cls: Type[ComputeBackend]):
        compute_backend_registry.register(name, cls)
        return cls
    return decorator


@register_compute_backend("ollama")
@register_compute_backend("laptop_gpu")
class OllamaBackend(ComputeBackend):
    """
    Local GPU Workstation via Ollama Daemon (Port 11434).
    """
    def __init__(self, base_url: Optional[str] = None, model_tag: str = "qwen3:4b-q4_k_m"):
        self.base_url = base_url or os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
        self.model_tag = model_tag

    def is_online(self) -> bool:
        try:
            # Parse host and port from self.base_url
            clean = self.base_url.split("://")[-1]
            parts = clean.split(":")
            host = parts[0]
            port = int(parts[1]) if len(parts) > 1 else 11434
            
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(0.1)
                s.connect((host, port))
                return True
        except Exception:
            return False

    def generate(self, prompt: str, max_tokens: int = 512, temperature: float = 0.2, **kwargs) -> NormalizedResponse:
        t0 = time.time()
        url = f"{self.base_url}/api/chat"
        backend_type_label = "remote_node_gpu" if "127.0.0.1" not in self.base_url and "localhost" not in self.base_url else "laptop_gpu"
        payload = {
            "model": kwargs.get("model", self.model_tag),
            "messages": [{"role": "user", "content": prompt}],
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens
            }
        }
        try:
            res = requests.post(url, json=payload, timeout=60)
            t1 = time.time()
            dur = max(t1 - t0, 0.0001)
            if res.status_code == 200:
                data = res.json()
                content = data.get("message", {}).get("content", "")
                eval_count = data.get("eval_count", len(content.split()))
                tps = eval_count / dur if dur > 0 else 0.0
                return NormalizedResponse(
                    success=True,
                    content=content,
                    model=payload["model"],
                    tokens_generated=eval_count,
                    duration_seconds=dur,
                    tokens_per_second=tps,
                    backend_type=backend_type_label,
                    raw_response=data
                )
            return NormalizedResponse(
                success=False,
                content="",
                model=payload["model"],
                backend_type=backend_type_label,
                error=f"Ollama HTTP {res.status_code} at {url}: {res.text}"
            )
        except Exception as e:
            return NormalizedResponse(
                success=False,
                content="",
                model=self.model_tag,
                backend_type=backend_type_label,
                error=f"Ollama connection error at {url}: {str(e)}"
            )


@register_compute_backend("vllm_cluster")
@register_compute_backend("vllm")
@register_compute_backend("cluster_gpu")
class VLLMClusterBackend(ComputeBackend):
    """
    Full real client implementation for enterprise multi-GPU clusters running vLLM.
    Communicates via vLLM's standard OpenAI-compatible API (`/v1/chat/completions`, `/v1/models`, `/health`).
    
    NOTE ON HARDWARE VALIDATION:
    This client is fully implemented and production-ready, but has not yet been benchmarked
    against live enterprise GPU cluster hardware (e.g. 4x A100 80GB SXM4). Pre-deployment staging
    must verify against a live `vllm serve` instance.
    """
    def __init__(self, endpoint_url: Optional[str] = None, api_key: Optional[str] = None, timeout_seconds: float = 60.0):
        # Config precedence: Explicit argument -> VLLM_SERVER_URL -> VLLM_CLUSTER_ENDPOINT -> default cluster IP
        raw_url = (
            endpoint_url
            or os.getenv("VLLM_SERVER_URL")
            or os.getenv("VLLM_CLUSTER_ENDPOINT")
            or "http://10.0.0.100:8000/v1"
        )
        self.base_url = raw_url.rstrip("/")
        # If user passed root URL without /v1, append /v1 for standard OpenAI routes
        if not self.base_url.endswith("/v1"):
            self.api_root = self.base_url
            self.v1_url = f"{self.base_url}/v1"
        else:
            self.v1_url = self.base_url
            self.api_root = self.base_url[:-3]

        self.api_key = api_key or os.getenv("VLLM_API_KEY", "EMPTY")
        self.timeout_seconds = float(os.getenv("VLLM_TIMEOUT_SECONDS", str(timeout_seconds)))

    def _get_headers(self) -> Dict[str, str]:
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        if self.api_key and self.api_key != "EMPTY":
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    def is_online(self) -> bool:
        """
        Real non-blocking probe to verify if the remote vLLM server engine is live.
        Per official vLLM instrumentator docs:
          - GET /health returns 200 OK if healthy, 503 if engine dead.
          - Fallback probe: GET /v1/models returns 200 with list of served models.
        """
        # Try /health first (fast engine health endpoint)
        health_url = f"{self.api_root}/health"
        try:
            res = requests.get(health_url, headers=self._get_headers(), timeout=1.5)
            if res.status_code == 200:
                return True
        except Exception:
            pass

        # Fallback probe to /v1/models
        models_url = f"{self.v1_url}/models"
        try:
            res = requests.get(models_url, headers=self._get_headers(), timeout=1.5)
            return res.status_code == 200
        except Exception:
            return False

    def build_request_payload(
        self,
        prompt: str,
        max_tokens: int = 512,
        temperature: float = 0.2,
        system_prompt: Optional[str] = None,
        stream: bool = False,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Constructs the strict OpenAI-compatible Chat Completions payload expected by vLLM server.
        """
        model_name = kwargs.get("model") or kwargs.get("model_name") or "enterprise-cluster-70b"
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        payload: Dict[str, Any] = {
            "model": model_name,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "top_p": kwargs.get("top_p", 0.95),
            "stream": stream,
        }

        # Pass through any vLLM-specific / OpenAI parameters if supplied
        if "presence_penalty" in kwargs:
            payload["presence_penalty"] = kwargs["presence_penalty"]
        if "frequency_penalty" in kwargs:
            payload["frequency_penalty"] = kwargs["frequency_penalty"]
        if "stop" in kwargs:
            payload["stop"] = kwargs["stop"]
        if "best_of" in kwargs:
            payload["best_of"] = kwargs["best_of"]

        return payload

    def generate(
        self,
        prompt: str,
        max_tokens: int = 512,
        temperature: float = 0.2,
        system_prompt: Optional[str] = None,
        **kwargs
    ) -> NormalizedResponse:
        """
        Executes a real HTTP POST request against the vLLM OpenAI-compatible server.
        Normalizes the response into NormalizedResponse format.
        """
        t0 = time.time()
        url = f"{self.v1_url}/chat/completions"
        payload = self.build_request_payload(
            prompt=prompt,
            max_tokens=max_tokens,
            temperature=temperature,
            system_prompt=system_prompt,
            stream=False,
            **kwargs
        )
        model_name = payload["model"]

        try:
            res = requests.post(
                url,
                json=payload,
                headers=self._get_headers(),
                timeout=self.timeout_seconds
            )
            t1 = time.time()
            dur = max(t1 - t0, 0.0001)

            if res.status_code == 200:
                data = res.json()
                choices = data.get("choices", [])
                if choices and "message" in choices[0]:
                    content = choices[0]["message"].get("content", "")
                elif choices and "text" in choices[0]:
                    content = choices[0].get("text", "")
                else:
                    content = ""

                # Extract usage tokens if reported by vLLM
                usage = data.get("usage", {})
                completion_tokens = usage.get("completion_tokens", len(content.split()))
                tps = completion_tokens / dur if dur > 0 else 0.0

                return NormalizedResponse(
                    success=True,
                    content=content,
                    model=model_name,
                    tokens_generated=completion_tokens,
                    duration_seconds=dur,
                    tokens_per_second=tps,
                    backend_type="vllm_cluster",
                    raw_response=data
                )
            else:
                return NormalizedResponse(
                    success=False,
                    content="",
                    model=model_name,
                    backend_type="vllm_cluster",
                    error=f"vLLM Server HTTP {res.status_code} at {url}: {res.text}"
                )

        except requests.exceptions.ConnectionError as e:
            return NormalizedResponse(
                success=False,
                content="",
                model=model_name,
                backend_type="vllm_cluster",
                error=f"vLLM cluster connection refused at {url}. Ensure remote vLLM daemon is running."
            )
        except requests.exceptions.Timeout as e:
            return NormalizedResponse(
                success=False,
                content="",
                model=model_name,
                backend_type="vllm_cluster",
                error=f"vLLM cluster request timed out after {self.timeout_seconds}s at {url}."
            )
        except Exception as e:
            return NormalizedResponse(
                success=False,
                content="",
                model=model_name,
                backend_type="vllm_cluster",
                error=f"vLLM cluster inference error: {str(e)}"
            )


def get_backend_for_model(model_id: str) -> tuple[ComputeBackend, str]:
    """
    Returns (backend_instance, display_label).
    Resolves backend dynamically via ComputeBackendRegistry with generic display labels.
    Supports 1-IP distributed laptop nodes via model_meta.endpoint_url with automatic
    self-healing fallback to local GPU if a remote laptop disconnects.
    """
    from apps.admin_backend.models.manager import model_manager
    model_meta = model_manager.models.get(model_id)

    backend_type = os.getenv("ACTIVE_COMPUTE_BACKEND", (model_meta.backend if model_meta and model_meta.backend else "laptop_gpu"))

    backend_cls = compute_backend_registry.get_backend_class(backend_type)
    if backend_cls is None:
        backend_cls = OllamaBackend

    endpoint_url = model_meta.endpoint_url if model_meta and model_meta.endpoint_url else None
    
    # Check if backend class accepts base_url/endpoint_url
    if backend_cls is OllamaBackend:
        backend_inst = OllamaBackend(base_url=endpoint_url)
        # If assigned a remote node and it's offline, fallback to local Ollama with dynamic swapping
        if endpoint_url and "127.0.0.1" not in endpoint_url and "localhost" not in endpoint_url:
            if not backend_inst.is_online():
                logger.warning(f"Remote compute node at {endpoint_url} is offline for model '{model_id}'. Falling back to local edge GPU.")
                backend_inst = OllamaBackend(base_url="http://127.0.0.1:11434")
    elif backend_cls is VLLMClusterBackend:
        backend_inst = VLLMClusterBackend(endpoint_url=endpoint_url)
    else:
        backend_inst = backend_cls()

    if model_meta:
        label = model_meta.display_name or model_meta.name
    else:
        label = model_id

    return backend_inst, label

def get_compute_backend(backend_type: Optional[str] = None) -> ComputeBackend:
    selected = backend_type or os.getenv("ACTIVE_COMPUTE_BACKEND", "laptop_gpu").lower()
    backend_cls = compute_backend_registry.get_backend_class(selected) or OllamaBackend
    return backend_cls()
