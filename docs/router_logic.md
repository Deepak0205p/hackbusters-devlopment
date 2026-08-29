# Intelligent Request Router Logic
## Sovereign On-Premise Agentic AI Workbench (SIH26117)

---

## 1. Overview
The Intelligent Router automatically classifies incoming user prompts and multimodal payloads in real time. It dispatches each task to the optimal specialized open-weight model without requiring the user to manually select a model.

The routing engine uses a **Two-Stage Task-Classification Pipeline**:
1. **Stage 1 (Deterministic Fast Path):** Ultra-fast regex rules and keyword heuristics (< 2ms execution time).
2. **Stage 2 (Semantic Embedding Fallback):** Dense cosine similarity matching against domain anchor embeddings using local `BAAI/bge-small-en-v1.5` (< 25ms execution time).

```mermaid
flowchart TD
    Start([User Request Ingested]) --> CheckPayload{Contains Image / Scanned PDF?}
    CheckPayload -- Yes --> RouteVision[Route to Qwen2-VL 2B + PaddleOCR]
    CheckPayload -- No --> Stage1[Stage 1: Regex & Keyword Pattern Matcher]
    
    Stage1 --> MatchFound{Match Confidence >= Threshold?}
    MatchFound -- Yes: Coding Pattern --> RouteCoding[Route to Qwen 2.5 Coder 3B]
    MatchFound -- Yes: Reasoning Pattern --> RouteReasoning[Route to Qwen 3 4B]
    MatchFound -- Yes: Vision/OCR Pattern --> RouteVision
    MatchFound -- Yes: General Chat Pattern --> RouteGeneral[Route to Llama 3.2 3B]
    
    MatchFound -- No: Uncertain / Ambiguous --> Stage2[Stage 2: Dense Semantic Embedding Matcher\n(BAAI/bge-small-en-v1.5)]
    Stage2 --> CosineSim[Compute Cosine Similarity against Task Domain Vectors]
    
    CosineSim --> TopDomain{Highest Cosine Similarity}
    TopDomain -- Domain: Coding --> RouteCoding
    TopDomain -- Domain: Reasoning/Planning --> RouteReasoning
    TopDomain -- Domain: Vision/DocAnalysis --> RouteVision
    TopDomain -- Domain: General / Fallback --> RouteGeneral
```

---

## 2. Exact Routing Table

| Task Domain | Primary Target Model | Secondary / Supporting Tool | Trigger Characteristics |
| :--- | :--- | :--- | :--- |
| **Coding & Math** | **Qwen 2.5 Coder 3B** | Docker Sandbox (`python3`) | Python code generation, algorithmic calculations, debugging stack traces, script execution, pump/valve formulas. |
| **Reasoning & Planning** | **Qwen 3 4B** | ChromaDB RAG, Word/Excel Gen | Multi-step agent planning, SOP policy evaluation, root-cause synthesis, drafting formal executive approval notes. |
| **Vision & Multimodal** | **Qwen2-VL 2B** | PaddleOCR / Tesseract Engine | Scanned inspection PDFs, P&ID engineering drawings, handwritten maintenance notes, equipment photographs. |
| **General Conversation** | **Llama 3.2 3B** | Direct Response | Open-ended Q&A, greetings, text summaries, non-technical queries, simple phrasing requests. |

---

## 3. Stage 1: Deterministic Pattern & Keyword Rules

### 3.1. Coding Intent Patterns (`qwen2.5-coder-3b`)
- **Regex Patterns:**
  - `(?i)\b(def|class|import|return|lambda|function|variable|stdout|stderr|traceback|syntaxerror|exception)\b`
  - `(?i)\b(write|create|generate|fix|debug|run|execute)\s+(a\s+)?(python|script|code|program|function|algorithm)\b`
  - `(?i)\b(calculate|compute)\b.*?\b(hydraulic efficiency|brake horsepower|flow rate|reynolds number|head loss|pressure drop)\b`
- **Keywords:** `python`, `pip`, `docker`, `script`, `syntax`, `code`, `dataframe`, `pandas`, `numpy`, `regex`, `unit test`.

### 3.2. Reasoning & Planning Intent Patterns (`qwen3-4b`)
- **Regex Patterns:**
  - `(?i)\b(draft|prepare|generate)\s+(an?\s+)?(approval note|executive summary|mopng memo|turnaround plan|sop compliance)\b`
  - `(?i)\b(evaluate|analyze|assess|synthesize)\b.*?\b(policy|safety standard|refinery sop|clause|deviation)\b`
  - `(?i)\b(plan|break down|step by step|root cause analysis|rca)\b`
- **Keywords:** `approval note`, `sop`, `refinery policy`, `mrpl manual`, `recommendation`, `turnaround`, `compliance audit`, `furnace decoking`.

### 3.3. Multimodal & Vision Intent Patterns (`qwen2-vl-2b`)
- **Payload Condition:** Presence of uploaded binary files with MIME types `image/*`, `application/pdf` or scanned file attachments.
- **Regex Patterns:**
  - `(?i)\b(ocr|scan|read|extract|inspect|diagram|schematic|p&id|piping and instrumentation|drawing|photo)\b`
  - `(?i)\b(read the attached|extract text from|identify valves in|transmitters in)\b`
- **Keywords:** `p&id`, `scanned pdf`, `inspection sheet`, `drawing`, `gauge`, `ocr`, `valve tag`, `handwritten`.

### 3.4. General Intent (`llama-3.2-3b`)
- **Keywords:** `hello`, `hi`, `explain in simple terms`, `summarize this conversation`, `who are you`, `help`.

---

## 4. Stage 2: Dense Semantic Embedding Fallback

When Stage 1 pattern matching yields ambiguous confidence scores (e.g. matching score $< 0.65$), the input prompt is converted to a 384-dimensional dense vector using the local `BAAI/bge-small-en-v1.5` model.

### Task Domain Anchor Embeddings
Pre-computed centroid vectors represent each domain:
- $\mathbf{V}_{\text{coding}}$: Centroid of software engineering, Python scripting, numerical algorithms, and debugging queries.
- $\mathbf{V}_{\text{reasoning}}$: Centroid of industrial standard interpretation, root cause evaluation, SOP analysis, and executive memo synthesis.
- $\mathbf{V}_{\text{vision}}$: Centroid of spatial parsing, diagram understanding, equipment visual checks, and scanned OCR tasks.
- $\mathbf{V}_{\text{general}}$: Centroid of conversational interactions, text reformulations, and general queries.

### Classification Metric:
$$\text{Domain}^* = \arg\max_{d \in \{\text{coding}, \text{reasoning}, \text{vision}, \text{general}\}} \frac{\mathbf{q} \cdot \mathbf{V}_d}{\|\mathbf{q}\| \|\mathbf{V}_d\|}$$

If $\max(\text{sim}) < 0.30$, default fallback is set to **`llama-3.2-3b`** (General Assistant).

---

## 5. Performance & Accuracy Targets
- **Routing Decision Latency:**
  - Stage 1 match: $< 2\text{ ms}$
  - Stage 2 match: $< 25\text{ ms}$
- **Target Accuracy:** $> 99\%$ classification across SIH evaluation benchmarks.
