# Architecture Flow


Diagram:

```json
flowchart TB
  %% =========================
  %% Functional Architecture: Templates + CLI Composer
  %% =========================

  U["👤 User / Developer"] -->|runs| CLI["🧰 CLI: create-xxx<br/>Wizard + non-interactive mode"]

  %% ----- Catalog Discovery -----
  CLI -->|loads| CAT["📚 Catalog Resolver"]
  CAT -->|scans manifests| FS[("🗂️ Repo filesystem")]
  FS --> TB["📦 Templates: Bases"]
  FS --> TA["🧩 Templates: Addons"]
  TB --> MB["📄 base manifest.json"]
  TA --> MA["📄 addon manifest.json"]

  CAT -->|returns list| BASES[("Bases list")]
  CAT -->|returns list| ADDONS[("Addons list")]
  CAT -->|returns| MATRIX["🧪 Compatibility Matrix<br/>(requires/provides/conflicts)"]

  %% ----- User Choices -----
  CLI -->|selects| SELBASE["✅ Selected Base"]
  CLI -->|selects| SELADD["✅ Selected Addons"]
  CLI -->|collects| ANSW["📝 Answers / Vars<br/>(projectName, db, auth, envs, etc.)"]

  %% ----- Validation & Planning -----
  SELBASE --> PLAN["🧠 Build Plan"]
  SELADD --> PLAN
  MATRIX -->|validate| PLAN
  ANSW --> PLAN

  PLAN -->|fails| ERR["❌ Explain conflicts / missing requirements"]
  PLAN -->|ok| ENG["⚙️ Engine: Composer"]

  %% =========================
  %% Engine Pipeline
  %% =========================
  ENG --> STAGE["📁 Stage Workspace<br/>(temp dir)"]
  STAGE --> STEP1["1️⃣ Render Base Template"]
  STEP1 -->|copy/render| OUTTREE["🌳 Output Tree<br/>(project files)"]

  STEP1 --> STEP2["2️⃣ Apply Addons in Order"]
  STEP2 -->|for each addon| OPS{"Addon Ops"}
  OPS --> OP_COPY["📄 copy files"]
  OPS --> OP_TPL["🧩 template render<br/>(mustache/ejs)"]
  OPS --> OP_JSON["🧷 json merge<br/>(package.json, tsconfig, etc.)"]
  OPS --> OP_TEXT["✂️ text insert/replace"]
  OPS --> OP_CODEMOD["🧬 codemod AST<br/>(ts-morph/jscodeshift)"]
  OPS --> OP_ENV["🔐 env append / secrets placeholders"]

  OP_COPY --> OUTTREE
  OP_TPL --> OUTTREE
  OP_JSON --> OUTTREE
  OP_TEXT --> OUTTREE
  OP_CODEMOD --> OUTTREE
  OP_ENV --> OUTTREE

  STEP2 --> STEP3["3️⃣ Post Steps"]
  STEP3 --> PS_LOCK["🔧 Package manager setup<br/>(pnpm/npm/yarn)"]
  STEP3 --> PS_INSTALL["📦 Install deps"]
  STEP3 --> PS_FMT["🧼 Format + Lint + Typecheck"]
  STEP3 --> PS_TEST["🧪 Smoke tests (optional)"]
  STEP3 --> PS_GIT["🌱 git init + initial commit (optional)"]
  STEP3 --> PS_DOC["🧾 Generate README / next steps"]

  PS_LOCK --> OUTTREE
  PS_INSTALL --> OUTTREE
  PS_FMT --> OUTTREE
  PS_TEST --> OUTTREE
  PS_GIT --> OUTTREE
  PS_DOC --> OUTTREE

  %% ----- Final output -----
  OUTTREE --> FINAL["✅ Generated Project Folder"]
  FINAL -->|prints| NEXT["➡️ Next steps:<br/>cd project && pnpm dev"]

  %% =========================
  %% Template Model (what exists in repo)
  %% =========================
  subgraph REPO_MODEL["📦 Repo Model (authoring time)"]
    direction LR

    subgraph BASE_MODEL["🧱 Base Stack"]
      direction TB
      BMAN["manifest.json<br/>id, capabilities, prompts, templateDir"] --> BTPL["template/<br/>server, config, scripts"]
      BTPL --> BHOOKS["Integration Surface<br/>(well-known paths/markers)"]
    end

    subgraph ADDON_MODEL["🧩 Addon"]
      direction TB
      AMAN["manifest.json<br/>requires/provides/conflicts<br/>prompts + ops"] --> APATCH["patches/<br/>files + snippets"]
      AMAN --> AOPS["ops pipeline steps"]
    end
  end

  %% =========================
  %% Compatibility / Safety
  %% =========================
  subgraph SAFETY["🛡️ Compatibility & Safety Rules"]
    direction TB
    R1["Requires/Provides matching"] --> R2["Conflicts detection"]
    R2 --> R3["File ownership / patch collision checks"]
    R3 --> R4["Order rules (dependencies between addons)"]
    R4 --> R5["Dry-run plan preview (optional)"]
  end

  MATRIX --> SAFETY
  SAFETY --> PLAN

  %% =========================
  %% Optional: Distribution
  %% =========================
  subgraph DIST["🚚 Distribution Options"]
    direction TB
    D1["Local templates in repo"] --> D2["Remote templates registry (optional)"]
    D2 --> D3["Versioned templates (semver)"]
  end

  CAT --> DIST
```