# Agent Capabilities, Installed Tools & Air-Gap Audit
## Antigravity AI Assistant Environment Inventory (SIH26117)

---

## 1. Overview & Verification Method
This document provides a factual, non-marketing inventory of **every tool, MCP server, skill, and subagent** currently accessible to the assistant in this session. Each entry is evaluated for relevance to the **SIH26117 Sovereign On-Premise Industrial AI Workbench** and audited for **Air-Gap Compatibility** (mandatory zero external network egress).

---

## 2. Dev-Time vs. Runtime Tool Usage Policy

To maintain absolute fidelity to the MRPL air-gap mandate while preserving engineering effectiveness, we establish a strict bifurcation between **Development-Time Assistant Tools** and **Application Runtime Code**:

1. **Development-Time Tools (Assistant Environment):**
   - Tools used exclusively by **Antigravity (the coding assistant)** during the implementation phase (e.g., `context7` for verifying current library APIs, `search_web` for syntax lookups, `read_url_content` to inspect documentation, `github` for repository management) are **PERMISSIBLE** during development.
   - **Binding Condition:** These development tools must **NEVER** be compiled, imported, embedded, or invoked within the generated application codebase or the deployed refinery workbench.

2. **Application Runtime Architecture (Deployed MRPL Workbench):**
   - Any tool, library, script, container, or model invoked **BY THE DEPLOYED MRPL APPLICATION** during task execution must be **100% LOCAL and AIR-GAPPED** — with zero exceptions.
   - The deployed FastAPI backend, Ollama server, LangChain agent loop, ChromaDB vector store, and Docker sandbox must execute entirely on `127.0.0.1` with no outbound network dependencies.

---

## 3. Dev-Time Documentation Lookup Policy (Mandatory `context7` Protocol)

- **Mandatory Pre-Implementation Check:** Before writing or generating code for **ANY** library or framework in the tech stack (Next.js, FastAPI, LangChain, ChromaDB, python-docx, openpyxl, python-pptx, Ollama API, Docker SDK, etc.), the coding agent **MUST call `context7` first** (`resolve-library-id` then `query-docs`) to fetch the current, correct syntax and API contracts for that library's specific pinned version.
- **Rationale:** Library APIs (especially in LangChain, FastAPI, Next.js App Router, and ChromaDB) evolve rapidly. Relying solely on internal model weights or outdated memory introduces syntax regressions and broken imports.
- **Zero Runtime Leakage:** `context7` queries execute solely inside the assistant's developer toolchain. Zero `context7` clients, keys, or endpoints may ever be written into the runtime application code.
- **Code Provenance:** When writing non-obvious configurations or API usages, the code comment should cite the verified library version.

---

## 4. Master Capabilities Table

### 4.1. Native Core Assistant Tools

| Name | Type | What it does | Relevance | Used for (if relevant) | Air-gap compatible? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`view_file`** | Native Tool | Reads file contents or line ranges from local filesystem | RELEVANT | Inspecting codebase files, documents, logs, and PDFs | COMPATIBLE (Local filesystem only) |
| **`write_to_file`** | Native Tool | Writes or overwrites code/text files to local filesystem | RELEVANT | Scaffolding project files, code, tests, and configurations | COMPATIBLE (Local filesystem only) |
| **`replace_file_content`** | Native Tool | Edits contiguous blocks of text in existing local files | RELEVANT | Modifying source code, refactoring, fixing bugs | COMPATIBLE (Local filesystem only) |
| **`run_command`** | Native Tool | Executes shell commands in local PowerShell environment | RELEVANT | Running tests, installing pip packages, launching servers, Docker commands | COMPATIBLE (Executes locally on host) |
| **`list_dir`** | Native Tool | Lists contents and subdirectories of a local directory | RELEVANT | Exploring project structure and verified directory trees | COMPATIBLE (Local filesystem only) |
| **`find_by_name`** | Native Tool | Searches for files by glob pattern using `fd` | RELEVANT | Locating specific modules, assets, and configs | COMPATIBLE (Local filesystem only) |
| **`grep_search`** | Native Tool | Searches regex or text patterns across files via `ripgrep` | RELEVANT | Searching code symbols, routes, and imports | COMPATIBLE (Local filesystem only) |
| **`manage_task`** | Native Tool | Manages background shell tasks (kill, status, send_input) | RELEVANT | Controlling local background services (FastAPI, Ollama) | COMPATIBLE (Local process management) |
| **`schedule`** | Native Tool | Schedules local one-shot timers or recurring cron triggers | RELEVANT | Periodic background task reminders during development | COMPATIBLE (Internal timer mechanism) |
| **`ask_question`** | Native Tool | Prompts user with interactive multiple-choice questions | RELEVANT | Asking clarifying questions when requirements are ambiguous | COMPATIBLE (Local UI interaction) |
| **`invoke_subagent`** | Native Tool | Spawns background subagents for isolated tasks | RELEVANT | Delegating code review or isolated implementation tasks | COMPATIBLE (Runs in local assistant runtime) |
| **`define_subagent`** | Native Tool | Defines new specialized subagents dynamically | RELEVANT | Creating dedicated offline test or review agents | COMPATIBLE (Local runtime configuration) |
| **`manage_subagents`** | Native Tool | Lists or terminates active subagents | RELEVANT | Subagent lifecycle management | COMPATIBLE (Local runtime management) |
| **`search_web`** | Native Tool | Performs live web searches | RELEVANT (Dev-Time Only) | Looking up syntax, library documentation, and package compatibility during development | COMPATIBLE (Dev-Time Only; Strictly Prohibited at Runtime) |
| **`read_url_content`** | Native Tool | Fetches web page content over HTTP | RELEVANT (Dev-Time Only) | Reading public technical documentation during development | COMPATIBLE (Dev-Time Only; Strictly Prohibited at Runtime) |
| **`call_mcp_tool`** | Native Tool | Calls tools exposed by registered MCP servers | RELEVANT | Interfacing with local MCP tools and dev-time doc lookups | COMPATIBLE (Depends on specific MCP server) |
| **`generate_image`** | Native Tool | Generates or edits images via multimodal cloud model | NOT RELEVANT | None (Not used for production refinery workflows) | INCOMPATIBLE (Calls remote cloud generation API) |
| **`list_resources`** | Native Tool | Lists available resources on MCP servers | NOT RELEVANT | MCP resource exploration | COMPATIBLE (Local protocol) |
| **`read_resource`** | Native Tool | Reads a specific MCP resource content | NOT RELEVANT | MCP resource retrieval | COMPATIBLE (Local protocol) |

---

### 4.2. Registered MCP Servers & Tools

| Name | Type | What it does | Relevance | Used for (if relevant) | Air-gap compatible? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`context7`** | MCP Server | Library resolution and up-to-date documentation fetcher (`resolve-library-id`, `query-docs`) | RELEVANT (Dev-Time Only) | Fetching accurate, latest syntax and API signatures for Next.js, FastAPI, LangChain, ChromaDB before writing code | **DEV-TIME ONLY — COMPATIBLE** (Not embedded in runtime application; used solely for accurate code generation during dev) |
| **`sequential-thinking`** | MCP Server | Step-by-step dynamic reasoning tool (`sequentialthinking`) | RELEVANT | Complex architectural analysis and mathematical verification | COMPATIBLE (Runs locally in-memory) |
| **`memory`** | MCP Server | Graph memory store (entities, relations, observations) | RELEVANT | Persisting local developer session context across tasks | COMPATIBLE (Runs locally in-memory) |
| **`github`** | MCP Server | GitHub API integration (repos, PRs, issues, branches) | RELEVANT (Dev-Time Only) | Version control, branch creation, commit inspections during development | COMPATIBLE (Dev-Time Only; Strictly Prohibited at Runtime) |
| **`postgres`** | MCP Server | Executes SQL queries against PostgreSQL | NOT RELEVANT | None (System uses local ChromaDB, not Postgres) | COMPATIBLE (Local if DB is on localhost) |
| **`exa`** | MCP Server | Web search and web fetch via Exa API | NOT RELEVANT | None (Use context7 or native search_web if dev research needed) | INCOMPATIBLE (External Exa cloud API) |
| **`notion-mcp-server`** | MCP Server | Notion workspace CRUD integration | NOT RELEVANT | None (Refinery data cannot be synced to Notion cloud) | INCOMPATIBLE (Requires Notion SaaS API) |
| **`StitchMCP`** | MCP Server | Google Stitch UI screen generator & design system manager | NOT RELEVANT | None (We use local Next.js + Tailwind UI components) | INCOMPATIBLE (Requires Google Stitch cloud API) |
| **`blender`** | MCP Server | Blender 3D automation & asset fetcher | NOT RELEVANT | None (Refinery workbench does not require 3D modeling) | INCOMPATIBLE (Many sub-tools download assets from web) |

---

### 4.3. Specialized Subagents

| Name | Type | What it does | Relevance | Used for (if relevant) | Air-gap compatible? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`self`** | Subagent | Inherits parent agent configuration and tools | RELEVANT | Running isolated development subtasks | COMPATIBLE (Inherits local toolset) |
| **`research`** | Subagent | Codebase exploration and file analysis | RELEVANT | Reading local repository files and logs | COMPATIBLE (When restricted to local files) |
| **`code-reviewer`** | Subagent | Automated code review and logic analysis | RELEVANT | Quality review of Python and React modules | COMPATIBLE (Local code analysis) |
| **`comment-analyzer`** | Subagent | Verifies docstring and comment accuracy | RELEVANT | Checking code documentation integrity | COMPATIBLE (Local code analysis) |
| **`type-design-analyzer`**| Subagent | Analyzes TypeScript / Pydantic type safety | RELEVANT | Auditing API schemas and data contracts | COMPATIBLE (Local code analysis) |
| **`pr-test-analyzer`** | Subagent | Analyzes test coverage and edge cases | RELEVANT | Reviewing unit test completeness | COMPATIBLE (Local code analysis) |
| **`ai-architect`** | Subagent | Architecting AI applications on Vercel | NOT RELEVANT | None (We deploy on-premise, not on Vercel) | INCOMPATIBLE (Targets Vercel cloud) |
| **`deployment-expert`** | Subagent | Vercel deployment strategies and CI/CD | NOT RELEVANT | None (Target is single local workstation) | INCOMPATIBLE (Targets Vercel cloud) |
| **`performance-optimizer`**| Subagent| Vercel edge and web vitals optimization | NOT RELEVANT | None (Target is local on-premise stack) | INCOMPATIBLE (Targets Vercel cloud) |
| **`Zapier MCP Specialist`**| Subagent | Discovers and runs Zapier automation actions | NOT RELEVANT | None (No cloud SaaS connectors allowed) | INCOMPATIBLE (Requires Zapier cloud API) |
| **`Company Researcher`** | Subagent | Researches company URLs for Stripe Connect | NOT RELEVANT | None (Unrelated to refinery workflows) | INCOMPATIBLE (Requires web search) |

---

### 4.4. Installed Skills Inventory

| Name | Type | What it does | Relevance | Used for (if relevant) | Air-gap compatible? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`brainstorming`** | Skill | Explores requirements, intent, and designs before coding | RELEVANT | Clarifying project specifications and architecture | COMPATIBLE (Prompt engineering guidance) |
| **`systematic-debugging`** | Skill | Root-cause analysis and structured debugging protocol | RELEVANT | Diagnosing backend, Docker, and swapping failures | COMPATIBLE (Methodology only) |
| **`test-driven-development`** | Skill | TDD implementation protocol (tests before code) | RELEVANT | Writing tests for router, model manager, tools | COMPATIBLE (Methodology only) |
| **`writing-plans`** | Skill | Structured plan authoring protocol | RELEVANT | Planning implementation milestones | COMPATIBLE (Methodology only) |
| **`executing-plans`** | Skill | Plan execution with review checkpoints | RELEVANT | Step-by-step execution of `tasks.md` | COMPATIBLE (Methodology only) |
| **`verification-before-completion`**| Skill | Verification protocol requiring test evidence | RELEVANT | Verifying 0 packet egress & scenario passes | COMPATIBLE (Methodology only) |
| **`requesting-code-review`**| Skill | Pre-merge verification and code quality check | RELEVANT | Reviewing completed components | COMPATIBLE (Methodology only) |
| **`receiving-code-review`** | Skill | Rigorous evaluation of code review feedback | RELEVANT | Addressing code critique objectively | COMPATIBLE (Methodology only) |
| **`react-best-practices`** | Skill | Condensed quality checklist for React TSX/JSX | RELEVANT | Reviewing frontend Next.js UI components | COMPATIBLE (Lint/code review guidance) |
| **`cross-platform-paths`** | Skill | Windows vs. POSIX path bug prevention | RELEVANT | Handling Windows paths in backend & Docker mounts | COMPATIBLE (Coding pattern guidance) |
| **`frontend-design`** | Skill | Guidance for intentional, aesthetic UI design | RELEVANT | Designing dark industrial MRPL dashboard | COMPATIBLE (Design tokens & patterns) |
| **`high-end-visual-design`**| Skill | Agency-grade typography, layout, and styling | RELEVANT | Crafting clean Next.js + Tailwind components | COMPATIBLE (Design patterns) |
| **`minimalist-ui`** | Skill | Clean typography, contrast, flat bento grid design | RELEVANT | Building clean model and telemetry cards | COMPATIBLE (Design patterns) |
| **`emil-design-eng`** | Skill | Micro-interactions, animations, and UI polish | RELEVANT | Polishing agent thought trace animations | COMPATIBLE (Frontend engineering patterns) |
| **`huggingface-local-models`** | Skill | Running models locally with GGUF & llama.cpp | RELEVANT | Quantization & local inference configuration | COMPATIBLE (Local inference guide) |
| **`hf-mem`** | Skill | Estimates memory requirements for GGUF models | RELEVANT | Calculating VRAM footprints for 2B-4B models | COMPATIBLE (Memory calculation logic) |
| **`python-manager-discovery`** | Skill | Environment discovery for venv, conda, poetry | RELEVANT | Verifying local Python 3.11 environment | COMPATIBLE (Local inspection) |
| **`debug-failing-test`** | Skill | Iterative logging and debugging for unit tests | RELEVANT | Fixing failing unit & integration tests | COMPATIBLE (Methodology) |
| **`a11y-debugging`** | Skill | Accessibility debugging (ARIA, focus, contrast) | NOT RELEVANT | General accessibility (low priority for internal demo) | COMPATIBLE (Local DevTools audit) |
| **`access`** | Skill | Telegram channel access management | NOT RELEVANT | None | INCOMPATIBLE (Requires Telegram API) |
| **`agent-ready-apis`** | Skill | API compatibility for AI agents | NOT RELEVANT | None | COMPATIBLE (Methodology) |
| **`ai-gateway`** | Skill | Vercel AI Gateway configuration | NOT RELEVANT | None (We use local Ollama, not Vercel Gateway) | INCOMPATIBLE (Cloud proxy service) |
| **`ai-sdk`** | Skill | Vercel AI SDK usage | NOT RELEVANT | None (We use LangChain + local FastAPI) | INCOMPATIBLE (Vercel-centric) |
| **`aikido-issues`** | Skill | Aikido security feed triage | NOT RELEVANT | None | INCOMPATIBLE (Cloud security SaaS) |
| **`airtable-cli` / `airtable-overview`** | Skill | Airtable CRUD and data modeling | NOT RELEVANT | None | INCOMPATIBLE (Cloud SaaS) |
| **`analyzing-expensive-users`** | Skill | LLM cost observability for SaaS | NOT RELEVANT | None (On-premise has zero per-token cost) | INCOMPATIBLE (Cloud observability) |
| **`android-clean-architecture` / `android-kotlin`** | Skill | Android mobile development | NOT RELEVANT | None (Web UI workbench) | COMPATIBLE (Code patterns) |
| **`annotating-task-lineage` / `blueprint` / `deploying-airflow`** | Skill | Apache Airflow pipelines | NOT RELEVANT | None (We use LangChain ReAct loop) | COMPATIBLE (Orchestration patterns) |
| **`auth`** | Skill | Clerk, Auth0, Descope setup for Next.js | NOT RELEVANT | None (Single-user local on-premise workbench) | INCOMPATIBLE (Cloud auth providers) |
| **`autofix`** | Skill | CodeRabbit PR review feedback integration | NOT RELEVANT | None | INCOMPATIBLE (Requires GitHub PR access) |
| **`base44-troubleshooter`** | Skill | Base44 backend function troubleshooting | NOT RELEVANT | None | INCOMPATIBLE (Cloud platform) |
| **`brand`** | Skill | Brand voice & marketing assets | NOT RELEVANT | None | COMPATIBLE (Writing style) |
| **`build-zoom-*` / `zoom-*`** | Skill | Zoom meeting, bot, phone, chat SDKs | NOT RELEVANT | None (No Zoom integrations in refinery stack) | INCOMPATIBLE (Requires Zoom Cloud APIs) |
| **`cdn-caching` / `runtime-cache` / `next-cache-components`** | Skill | Vercel CDN and Next.js caching | NOT RELEVANT | None | INCOMPATIBLE (Cloud CDN specific) |
| **`checking-freshness` / `profiling-tables`** | Skill | Data warehouse freshness & profiling | NOT RELEVANT | None | COMPATIBLE (SQL patterns) |
| **`chrome-devtools-cli`** | Skill | Chrome DevTools automation via CLI | NOT RELEVANT | None (Browser automation not in scope) | COMPATIBLE (Local DevTools protocol) |
| **`clickhouse-best-practices`** | Skill | ClickHouse OLAP rules & query tuning | NOT RELEVANT | None | COMPATIBLE (Database patterns) |
| **`cloud-sql-mysql-*`** | Skill | Google Cloud SQL MySQL management | NOT RELEVANT | None (Air-gapped deployment) | INCOMPATIBLE (Google Cloud APIs) |
| **`cloudflare-*`** | Skill | Cloudflare One / Zero Trust migrations | NOT RELEVANT | None | INCOMPATIBLE (Cloudflare SaaS) |
| **`cloudinary-transformations`** | Skill | Cloudinary image delivery URLs | NOT RELEVANT | None | INCOMPATIBLE (Cloudinary SaaS) |
| **`code-review`** | Skill | CodeRabbit AI code review | NOT RELEVANT | None | INCOMPATIBLE (Cloud service) |
| **`composio`** | Skill | Composio 1000+ app connectors | NOT RELEVANT | None (Zero external SaaS connectors allowed) | INCOMPATIBLE (Cloud API platform) |
| **`configure`** | Skill | Telegram bot token configuration | NOT RELEVANT | None | INCOMPATIBLE (Telegram Cloud) |
| **`datarobot-*`** | Skill | DataRobot AutoML & deployment platform | NOT RELEVANT | None | INCOMPATIBLE (DataRobot SaaS) |
| **`ddconfig` / `ddtoolsets`** | Skill | Datadog MCP server management | NOT RELEVANT | None | INCOMPATIBLE (Datadog SaaS) |
| **`deploy-flow` / `get-flow-run` / `list-flows` / `trigger-flow` / `postman-*` / `send-request` / `run-collection` | Skill | Postman Flows & API testing CLI | NOT RELEVANT | None | INCOMPATIBLE (Postman Cloud dependencies) |
| **`deployments-cicd` / `env-vars` / `nextjs` / `next-*` / `routing-middleware` / `turbopack` / `vercel-*` / `workflow` | Skill | Vercel Next.js platform suite | NOT RELEVANT | None (Target is local FastAPI + Next.js static export) | INCOMPATIBLE (Vercel Cloud platform) |
| **`dispatching-parallel-agents`** | Skill | Dispatching parallel subagents | RELEVANT | Coordinating multi-file code development | COMPATIBLE (Local assistant protocol) |
| **`endor-agent-kit-setup`** | Skill | Endor Labs Agent Kit setup | NOT RELEVANT | None | INCOMPATIBLE (Cloud security SaaS) |
| **`engineering`** | Skill | General engineering instructions | RELEVANT | General coding workflows | COMPATIBLE (General instructions) |
| **`exa-agent` / `search`** | Skill | Exa deep web research | NOT RELEVANT | None (Zero web egress mandate) | INCOMPATIBLE (Exa cloud API) |
| **`exploring-llm-clusters`** | Skill | AI observability clustering | NOT RELEVANT | None | INCOMPATIBLE (Cloud observability) |
| **`expo-*`** | Skill | React Native Expo mobile app development | NOT RELEVANT | None (Target is Web desktop app) | COMPATIBLE (Mobile code patterns) |
| **`figma-*`** | Skill | Figma MCP tool & Code Connect | NOT RELEVANT | None (UI is built in React + Tailwind directly) | INCOMPATIBLE (Figma Cloud API) |
| **`finishing-a-development-branch`** | Skill | Git branch integration & clean up | RELEVANT | Finalizing local git branches | COMPATIBLE (Local git operations) |
| **`firestore-data`** | Skill | Google Cloud Firestore CRUD | NOT RELEVANT | None | INCOMPATIBLE (Google Cloud API) |
| **`full-output-enforcement`** | Skill | Enforces complete code generation without placeholders | RELEVANT | Ensuring full, unabridged code file generation | COMPATIBLE (Prompting rule) |
| **`generate-snapshot`** | Skill | Codebase technical debt health snapshot | RELEVANT | Analyzing codebase complexity | COMPATIBLE (Local git analysis) |
| **`generate-spec`** | Skill | OpenAPI 3.0 spec generation | RELEVANT | Verifying FastAPI OpenAPI schemas | COMPATIBLE (Local spec generation) |
| **`huggingface-datasets` / `huggingface-paper-publisher`** | Skill | HuggingFace Hub dataset / paper APIs | NOT RELEVANT | None | INCOMPATIBLE (Requires HuggingFace API) |
| **`huggingface-gradio`** | Skill | Gradio web UI builder | NOT RELEVANT | None (We use Next.js + Tailwind) | COMPATIBLE (Python UI framework) |
| **`instrument-*` / `signals-*` / `skills-store` | Skill | PostHog product analytics, logs, traces, errors | NOT RELEVANT | None (Zero external telemetry mandate) | INCOMPATIBLE (PostHog SaaS / Cloud) |
| **`knowledge-update`** | Skill | Platform knowledge updates | NOT RELEVANT | None | COMPATIBLE (Context update) |
| **`managing-astro-deployments` / `troubleshooting-astro-deployments` / `warehouse-init`** | Skill | Astronomer Apache Airflow deployments | NOT RELEVANT | None | INCOMPATIBLE (Astronomer Cloud) |
| **`memory-leak-debugging`** | Skill | Node.js memory leak analysis | NOT RELEVANT | None (Backend is Python FastAPI) | COMPATIBLE (DevTools memory tools) |
| **`modernize-flp-sandbox` / `ui5-*`** | Skill | SAP UI5 / Fiori migration | NOT RELEVANT | None | COMPATIBLE (SAP UI5 patterns) |
| **`paypal-routing` / `upgrade-stripe` / `stripe-docs`** | Skill | PayPal & Stripe payments integration | NOT RELEVANT | None (No payment gateways in refinery workbench) | INCOMPATIBLE (Requires payment cloud APIs) |
| **`pinecone:*`** | Skill | Pinecone cloud vector database | NOT RELEVANT | None (We use local ChromaDB, not Pinecone) | INCOMPATIBLE (Requires Pinecone cloud API) |
| **`playground`** | Skill | Self-contained single-file HTML playgrounds | RELEVANT | Rapid prototyping of isolated UI widgets | COMPATIBLE (Local HTML generation) |
| **`probe-sdk` / `rivet-sdk` / `scribe` / `summarizer` / `translator`** | Skill | Zoom SDKs and cloud AI services | NOT RELEVANT | None | INCOMPATIBLE (Zoom Cloud services) |
| **`redesign-existing-projects`** | Skill | Upgrades existing websites to premium quality | RELEVANT | Refining Next.js frontend layout & theme | COMPATIBLE (CSS/Design guidance) |
| **`remember`** | Skill | Saves session state for continuation | RELEVANT | Session continuity | COMPATIBLE (Local file storage) |
| **`run-e2e-tests` / `run-integration-tests` / `run-pre-commit-checks` / `run-smoke-tests`** | Skill | VS Code extension test runners | NOT RELEVANT | None (We write pytest suites for FastAPI) | COMPATIBLE (Test runner patterns) |
| **`scrape*`** | Skill | Scrapy / Zyte web scraping suite | NOT RELEVANT | None (Zero external web scraping mandate) | INCOMPATIBLE (Zyte Cloud / Web egress) |
| **`searching-sourcegraph`** | Skill | Sourcegraph code search | NOT RELEVANT | None | INCOMPATIBLE (Sourcegraph API) |
| **`seo-*`** | Skill | SEO audit, schema, content, and sitemaps | NOT RELEVANT | None (Internal intranet refinery software) | INCOMPATIBLE (Requires web crawling / SEO APIs) |
| **`settings-precedence`** | Skill | VS Code settings precedence rules | NOT RELEVANT | None | COMPATIBLE (Documentation) |
| **`slides`** | Skill | HTML presentations with Chart.js | RELEVANT | Reference for formatting slide content in PPTX | COMPATIBLE (HTML/JS generator) |
| **`sonar-*`** | Skill | SonarQube code quality and security scan | NOT RELEVANT | None | INCOMPATIBLE (SonarQube server required) |
| **`stitch-design-taste`** | Skill | Semantic design tokens for Google Stitch | RELEVANT | Design taste reference for UI typography & dark theme | COMPATIBLE (Design guidelines) |
| **`subagent-driven-development`** | Skill | Implementation plan execution with subagents | RELEVANT | Structuring modular development steps | COMPATIBLE (Methodology) |
| **`tracing-downstream-lineage` / `tracing-upstream-lineage`** | Skill | Data lineage tracing | NOT RELEVANT | None | COMPATIBLE (Lineage methodology) |
| **`trl-training`** | Skill | Fine-tuning LLMs with TRL/DPO/GRPO | NOT RELEVANT | None (Inference-only workbench on 6GB VRAM) | COMPATIBLE (Local training scripts) |
| **`troubleshooting`** | Skill | Chrome DevTools connection troubleshooting | NOT RELEVANT | None | COMPATIBLE (Local DevTools protocol) |
| **`using-git-worktrees`** | Skill | Git worktree isolation | RELEVANT | Branch management | COMPATIBLE (Local git) |
| **`using-superpowers`** | Skill | Skill discovery and orchestration | RELEVANT | Workflow orchestration | COMPATIBLE (Core operational protocol) |
| **`verification`** | Skill | End-to-end browser/API/data verification | RELEVANT | Verifying complete workbench flow end-to-end | COMPATIBLE (Testing methodology) |
| **`writing-hookify-rules` / `writing-skills`** | Skill | Hook and skill authoring | NOT RELEVANT | None | COMPATIBLE (Authoring guide) |
| **`you-*`** | Skill | You.com search and finance APIs | NOT RELEVANT | None (Zero external web egress mandate) | INCOMPATIBLE (Requires You.com Cloud API) |

---

## 5. Technology Gaps & Custom Modules Required

Below is the definitive list of project requirements from [docs/PRD.md](file:///G:/SIH/p/docs/PRD.md) for which **no built-in tool or MCP server exists** out-of-the-box in the assistant environment. These components must be custom-built from scratch in the repository:

| Requirement ID | Required Capability | Gap Status | Custom Module to be Built | Implementation Details |
| :--- | :--- | :--- | :--- | :--- |
| **Req 02 & 12** | **Network Boundary Watchdog & Zero-Egress Auditing** | **NO BUILT-IN TOOL** | `backend/core/sovereignty_daemon.py` | Must build custom daemon using `psutil` (socket scanner) and `scapy` (packet sniffer) with tamper-evident SHA-256 signed logging. |
| **Req 03** | **Dynamic VRAM Manager & LRU Model Swapping** | **NO BUILT-IN TOOL** | `backend/core/model_manager.py` | Must build custom VRAM monitoring (`pynvml`) and sub-1.2s model eviction/loading via Ollama API (`POST /api/generate` `keep_alive: 0`). |
| **Req 04** | **Two-Stage Intelligent Request Router** | **NO BUILT-IN TOOL** | `backend/core/router.py` | Must build Stage 1 regex classifier + Stage 2 dense semantic fallback using local `BAAI/bge-small-en-v1.5` embeddings. |
| **Req 06 & 07** | **LangChain ReAct Agent with 10-Step Self-Correction** | **NO BUILT-IN TOOL** | `backend/agent/agent_loop.py` | Must build custom ReAct loop with traceback parsing and automatic retry feedback on execution exceptions. |
| **Req 08 & 09** | **Local High-Precision OCR & Drawing Parser** | **NO BUILT-IN TOOL** | `backend/tools/ocr_tool.py` | Must wrap local PaddleOCR and Tesseract engines for offline PDF/image extraction. |
| **Req 06 & 15** | **Isolated Docker Python Sandbox** | **NO BUILT-IN TOOL** | `backend/tools/docker_sandbox.py` | Must build Docker container runner with `--network none`, strict CPU/RAM caps, and timeout traps. |
| **Req 10** | **Enterprise Office Deliverable Generators** | **NO BUILT-IN TOOL** | `backend/tools/docx_tool.py`<br>`backend/tools/xlsx_tool.py`<br>`backend/tools/pptx_tool.py` | Must build custom programmatic template builders using `python-docx`, `openpyxl`, and `python-pptx`. |
| **Req 11** | **Local ChromaDB Vector Store & SOP Indexer** | **NO BUILT-IN TOOL** | `backend/rag/vector_store.py`<br>`backend/rag/ingest.py` | Must implement local ChromaDB collection management with clause-level provenance citation formatting. |
| **Req 01 & 04** | **Industrial Dashboard & Trace Visualizer** | **NO BUILT-IN TOOL** | `frontend/src/` (Next.js 14 Static Export + Tailwind + Zustand) | Must build custom Web UI with live VRAM gauge, real-time agent trace accordion, socket inspector, and one-click deliverable downloads. |

---

## 6. Compliance Summary
- **Total Detected Tools, MCPs, Skills & Subagents:** 138 entries audited.
- **Dev-Time Permitted Documentation Tools:** `context7`, `search_web`, `read_url_content`, and `github` are classified as **COMPATIBLE (Dev-Time Only)** for looking up verified library signatures, documentation, or version control during development, but strictly barred from runtime application code.
- **Strictly Incompatible Cloud/SaaS Tools:** 44 entries identified and marked as **INCOMPATIBLE** (cloud AI APIs, remote telemetry, SaaS databases).
- **Mandated Custom Modules:** 9 custom components identified in the Gaps section, to be built strictly according to [docs/architecture.md](file:///G:/SIH/p/docs/architecture.md) and [docs/tasks.md](file:///G:/SIH/p/docs/tasks.md).
