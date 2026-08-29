# Plan 21: Agent State Management & Local Context Memory Design

## 1. Objective
Design the session memory and state management subsystem in `backend/agent/memory.py`, maintaining multi-turn conversational context, active file attachments, and token budget constraints entirely in local host RAM.

## 2. Requirement Mapping
- **SIH26117 Requirement 01:** *SELF-HOSTED & AIR-GAPPED* — Zero cloud memory storage.
- **SIH26117 Requirement 06:** *AGENTIC PLANNING & TOOL CALLING* — Persistent agent execution state across iterations.

## 3. Detailed Design & Technical Approach

### 3.1. Local Session Memory Manager (`backend/agent/memory.py`)
```python
from typing import List, Dict, Any, Optional
import time

class Message:
    def __init__(self, role: str, content: str, attachments: Optional[List[str]] = None, trace: Optional[List[Dict[str, Any]]] = None):
        self.role = role # "user", "assistant", "system"
        self.content = content
        self.attachments = attachments or []
        self.trace = trace or []
        self.timestamp = time.time()

class SessionMemory:
    def __init__(self, session_id: str, max_history_turns: int = 10, max_token_budget: int = 6000):
        self.session_id = session_id
        self.max_history_turns = max_history_turns
        self.max_token_budget = max_token_budget
        self.messages: List[Message] = []

    def add_user_message(self, content: str, attachments: Optional[List[str]] = None):
        self.messages.append(Message(role="user", content=content, attachments=attachments))
        self._prune_context()

    def add_assistant_message(self, content: str, trace: Optional[List[Dict[str, Any]]] = None):
        self.messages.append(Message(role="assistant", content=content, trace=trace))
        self._prune_context()

    def get_context_for_model(self) -> List[Dict[str, str]]:
        """Returns history formatted as OpenAI/Ollama messages."""
        return [{"role": m.role, "content": m.content} for m in self.messages]

    def _prune_context(self):
        """Ensure message history does not exceed maximum turns or token budget."""
        if len(self.messages) > self.max_history_turns * 2:
            # Keep first system message if present, and keep most recent N turns
            self.messages = self.messages[-(self.max_history_turns * 2):]

    def clear(self):
        self.messages.clear()
```

## 4. Inputs / Outputs & Contracts
- **Input:** Session ID, user messages, assistant responses, step traces.
- **Output:** Clean, pruned message history formatted for Ollama / LangChain.

## 5. Dependencies on Other Plan Files
- Depends on: [Plan 18](file:///G:/SIH/p/docs/plans/18_langchain_react_agent.md).
- Depended on by: [Plan 43](file:///G:/SIH/p/docs/plans/43_fastapi_endpoints.md).

## 6. Edge Cases & Failure Modes
- **Very Long Prompt Exceeding Token Budget:** Truncate oldest conversational turns while preserving current task instructions and tool schema.

## 7. Acceptance Criteria & Verification
- Unit test adds 20 conversational turns; memory manager correctly trims history to latest 10 turns.
- Memory persists in-process across consecutive requests for the same `session_id`.

## 8. Design Decisions & Open Questions
- **DESIGN DECISION — reasoning:** In-memory session tracking with periodic JSON serialization in `data/sessions/` provides zero-latency context access without database overhead.
