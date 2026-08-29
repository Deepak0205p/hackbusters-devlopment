import os
from typing import List

# Ensure ChromaDB & HuggingFace telemetry are disabled
os.environ["ANONYMIZED_TELEMETRY"] = "False"
os.environ["CHROMA_TELEMETRY"] = "False"
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

_MODEL_INSTANCE = None

class LocalBGEEmbedder:
    """
    Air-gapped BAAI/bge-small-en-v1.5 embedding generator using sentence-transformers.
    Generates 384-dimensional normalized dense vectors.
    """
    def __init__(self, model_name: str = "BAAI/bge-small-en-v1.5"):
        self.model_name = model_name
        self._model = None
        self._load_model()

    def _load_model(self):
        try:
            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer(self.model_name)
        except Exception as e:
            print(f"[LocalBGEEmbedder] Warning: Failed to load {self.model_name}: {e}")
            self._model = None

    def embed_text(self, text: str) -> List[float]:
        if self._model is not None:
            vec = self._model.encode(text, normalize_embeddings=True)
            return [round(float(x), 6) for x in vec]
        return [0.0] * 384

    def embed_batch(self, texts: List[str], batch_size: int = 64) -> List[List[float]]:
        if self._model is not None:
            vecs = self._model.encode(texts, batch_size=batch_size, normalize_embeddings=True, show_progress_bar=False)
            return [[round(float(x), 6) for x in v] for v in vecs]
        return [[0.0] * 384 for _ in texts]

def get_embedder() -> LocalBGEEmbedder:
    global _MODEL_INSTANCE
    if _MODEL_INSTANCE is None:
        _MODEL_INSTANCE = LocalBGEEmbedder()
    return _MODEL_INSTANCE
