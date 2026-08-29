# Plan 03: Git Repository Initialization & Local Branching Strategy

## 1. Objective
Establish a clean local Git repository with strict `.gitignore` rules preventing accidental staging of heavy model weights, temporary Docker artifacts, and local ChromaDB caches, while defining a milestone-based branching model.

## 2. Requirement Mapping
- **SIH26117 Requirement 01:** *SELF-HOSTED & AIR-GAPPED* — Local-only git tracking with zero remote network leakages.
- **SIH26117 Requirement 02:** *ZERO EXTERNAL EGRESS* — Prevent credential or token commits.

## 3. Detailed Design & Technical Approach

### 3.1. `.gitignore` Configuration
Create a production `.gitignore` ensuring that large binary models, databases, and logs are excluded from commit history:
```gitignore
# Python & Environment
__pycache__/
*.py[cod]
.venv/
env/
*.env

# Next.js & Node
node_modules/
frontend/.next/
frontend/out/
.npm

# Local Heavy AI Models & Vector Store
data/chromadb/
data/models/
*.gguf
*.bin
*.onnx

# Temporary Outputs & Logs
data/outputs/
*.log
data/sample_inputs/*
!data/sample_inputs/.gitkeep

# OS Artifacts
.DS_Store
Thumbs.db
```

### 3.2. Local Branching & Commit Conventions
- Branch `main`: Stable release baseline.
- Branch `dev`: Active integration branch.
- Feature branches: `feat/model-manager`, `feat/router`, `feat/rag-engine`, `feat/sandbox`, `feat/ui-dashboard`.
- Commit format: `feat(scope): descriptive message`, `fix(scope): fix description`, `docs(scope): documentation update`.

## 4. Inputs / Outputs & Contracts
- **Input:** Project workspace.
- **Output:** Initialized local Git repository, configured `.gitignore`, clean initial commit.

## 5. Dependencies on Other Plan Files
- Depends on: [Plan 02](file:///G:/SIH/p/docs/plans/02_folder_structure.md).
- Depended on by: [Plan 04](file:///G:/SIH/p/docs/plans/04_dependency_pinning.md).

## 6. Edge Cases & Failure Modes
- **Accidental Commit of 5GB GGUF Model:** Git index explosion. Mitigated by explicit `*.gguf` and `data/models/` exclusion rules.
- **Staging Sensitive Refinery PDFs:** Sample PDFs in `data/sample_inputs/` must be sanitized synthetic test files.

## 7. Acceptance Criteria & Verification
- `git status` shows untracked files properly filtered according to `.gitignore`.
- Initial baseline commit tagged `v0.1.0-plan`.

## 8. Design Decisions & Open Questions
- **DESIGN DECISION — reasoning:** Local git repository only; remote GitHub push is restricted to developer backup during build time per Dev-Time policy in `docs/agent_capabilities.md`.
