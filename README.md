<div align="center">

# ⊞ Block Builder

**Visual API & UI Code Generator**

Drag-and-drop blocks to design your backend API and frontend UI — then generate production-ready TypeScript code instantly.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Hono](https://img.shields.io/badge/Hono-4-E36002?logo=hono&logoColor=white)](https://hono.dev/)
[![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![pnpm](https://img.shields.io/badge/pnpm-10-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)

![Block Builder Screenshot](docs/screenshot.png)

</div>

---

## What is Block Builder?

Block Builder is a visual code generation platform. Instead of writing boilerplate by hand, you design your system architecture by connecting blocks on a canvas — then export complete, ready-to-use code in seconds.

**Think of it as Figma, but for your backend API and frontend components.**

### How it works

```
Design on canvas  →  Connect blocks  →  Generate code  →  Paste into your project
```

1. Drag blocks onto the canvas (Interface, API endpoints, React hooks, UI components)
2. Connect blocks to define data flow and dependencies
3. Click **Generate** — get TypeScript, Python, Go, or Java code
4. Download the ZIP and drop it into your IDE

---

## Features

### 🧱 40+ Block Types across 7 Categories

| Category | Blocks | Output |
|----------|--------|--------|
| **API & NestJS** | GET/POST/PUT/PATCH/DELETE, NestJS Module/Service/Repository | Hono/NestJS/Express routes, 4-layer architecture |
| **TypeScript Types** | Interface, DTO, Enum, Pagination | TypeScript interfaces, Zod schemas, Prisma models |
| **Hooks & Store** | useQuery, useMutation, State Store | TanStack Query hooks, Zustand/Pinia stores |
| **Auth** | Auth Guard, JWT Config, Roles Guard, OAuth | NestJS guards, JWT module, Google/GitHub OAuth |
| **Infrastructure** | Middleware, Cache, Email, Job, WebSocket, Stripe | CORS+rate limit, Redis, Nodemailer, BullMQ |
| **UI Components** | DataTable, Form, Modal, Card, Chart, SearchBar | React components with loading/error states |
| **Layout** | Navigation, Page Route | React Router, navbar/sidebar components |

### ⚡ Multi-Language Code Generation

| Language | Framework | Generated |
|----------|-----------|-----------|
| 🟦 TypeScript | Hono / NestJS / Express / GraphQL / tRPC | Interfaces + Zod + API + Hooks + Components |
| 🐍 Python | FastAPI + Pydantic | Models + Routers + CRUD endpoints |
| 🐹 Go | Gin + GORM | Structs + Handlers + Routers |
| ☕ Java | Spring Boot + Lombok | Entities + Controllers + Services |

### ✦ AI Assistant
- Natural language → canvas blocks ("Design a user management system with JWT auth")
- Architecture review with scoring (0–100)
- Modify existing blocks via chat ("Add an address field to the User interface")
- Supports **Gemini** (free), **Groq** (free), and **Claude** (paid)

### 👁 Live App Preview
- Full multi-page application preview directly in the browser
- Interactive components — sortable tables, submittable forms, searchable inputs
- Desktop / tablet / mobile viewport switching
- Powered by faker.js with realistic fake data

### 🚀 Other Highlights
- **Code Diff view** — see exactly what changed between generations
- **Quality scoring** — 4-dimension analysis (security, performance, maintainability, test coverage)
- **16 built-in templates** — SaaS auth, e-commerce, real-time chat, task management, and more
- **One-click GitHub PR** — push generated code and open a pull request automatically
- **PWA offline mode** — install as a desktop app, works without internet
- **Version history & timeline** — undo/redo with fine-grained operation history
- **VSCode extension** — open the canvas inside your editor (`Ctrl+Shift+B`)
- **CLI tool** — `npx block-builder generate canvas.json -o ./src`

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) >= 20
- [pnpm](https://pnpm.io) >= 8 — `npm install -g pnpm`

### Quick Start

```bash
# Clone the repository
git clone https://github.com/your-username/block-builder.git
cd block-builder

# Install dependencies
pnpm install

# Start development servers
# Option 1: Use the start script (Windows)
start.bat

# Option 2: Manual (two terminals)
cd apps/server && pnpm dev   # http://localhost:3001
cd apps/web    && pnpm dev   # http://localhost:3000
```

Open **http://localhost:3000** in your browser.

### Environment Variables

Copy the example env file and configure:

```bash
cp .env.example .env
```

```env
# apps/server/.env

# Database (choose one)
DB_TYPE=sqlite                          # sqlite | postgres | mysql
SQLITE_PATH=./data/block-builder.db     # SQLite path (default)
DATABASE_URL=postgresql://...           # PostgreSQL / MySQL URL

# Auth
JWT_SECRET=your-secret-key-here

# GitHub OAuth (optional — for login & cloud sync)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://localhost:3001/auth/callback/github
FRONTEND_URL=http://localhost:3000
```

```env
# apps/web/.env
VITE_API_URL=http://localhost:3001
```

---

## Project Structure

```
block-builder/
├── apps/
│   ├── web/          # React 18 + Vite + TypeScript (frontend canvas & UI)
│   ├── server/       # Hono + Node.js (REST API + auth + DB)
│   └── desktop/      # Electron (optional desktop app)
├── packages/
│   ├── types/        # Shared TypeScript types (@block-builder/types)
│   ├── codegen/      # Code generation engine (@block-builder/codegen)
│   ├── cli/          # CLI tool (@block-builder/cli)
│   └── vscode/       # VSCode extension
├── start.bat         # Windows one-click start
├── Build.ps1         # Windows desktop app build script
└── pnpm-workspace.yaml
```

### Tech Stack

**Frontend**
- React 18, Vite 5, TypeScript 5.4
- React Flow (canvas), Monaco Editor (code view)
- TanStack Query, Zustand, Tailwind CSS

**Backend**
- Hono 4, Node.js, TypeScript
- Drizzle ORM, SQLite (libsql) / PostgreSQL / MySQL
- GitHub OAuth, JWT

**Desktop**
- Electron 29

---

## Building the Desktop App

Requires the frontend to be built first:

```powershell
# Build everything and launch
.\Build.ps1

# Or manually
cd apps/web && pnpm build
cd apps/desktop && npx electron-builder build --win
```

The installer/portable EXE will be in `apps/desktop/dist-electron/win-unpacked/`.

> **Distributing:** Copy the entire `win-unpacked/` folder. The `.exe` alone will not run.

---

## Using the CLI

```bash
# Initialize a canvas config
npx block-builder init

# Generate code from canvas.json
npx block-builder generate canvas.json -o ./src

# Generate with a specific framework
npx block-builder generate canvas.json -o ./src -a nestjs

# Watch mode — regenerate on save
npx block-builder watch canvas.json

# Pull a project from the server
npx block-builder pull <project-id>
```

---

## VSCode Extension

```bash
cd packages/vscode
pnpm install
pnpm build
# Install: vsce package --allow-missing-repository
```

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+B` | Open Block Builder canvas in editor |
| `Ctrl+Shift+G` | Generate code to `./generated/` |

---

## Templates

Block Builder ships with **16 production-ready templates**:

| Template | Blocks | Highlights |
|----------|--------|------------|
| User Management CRUD | 11 | JWT auth, roles, DataTable, Form |
| SaaS Auth System | 12 | OAuth + Refresh Token + roles |
| E-commerce Checkout | 11 | Stripe Checkout + Webhook |
| Real-time Chat | 10 | WebSocket + rooms + history |
| Blog with Comments | 11 | Nested comments + tags + SEO |
| Task Management | 10 | Kanban + assignees + due dates |
| Notification System | 9 | Email + BullMQ + in-app |
| Inventory Management | 10 | Stock movements + alerts + charts |
| API Gateway | 10 | Microservices + rate limiting + routing |
| Full-text Search | 8 | Redis cache + pagination |
| File Upload | 9 | Multer + S3 + progress |
| Analytics Dashboard | 7 | Charts + stats + navigation |
| NestJS Full Stack | 7 | Complete 4-layer architecture |
| E-commerce System | 8 | Products + orders |
| Blog System | 5 | Articles + pagination |
| Real-time Chat (basic) | 6 | WebSocket + JWT |

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Space` | Open Spotlight search |
| `Ctrl+Z / Ctrl+Y` | Undo / Redo |
| `Ctrl+C / Ctrl+V` | Copy / Paste selected block |
| `Ctrl+D` | Duplicate block |
| `Ctrl+S` | Save project |
| `Ctrl+F` | Global search |
| `Ctrl+B` | Toggle sidebar |
| `Ctrl+P` | Open app preview |
| `Tab / Shift+Tab` | Cycle through blocks |
| `↑↓←→` | Move selected block |
| `Delete` | Delete selected block |
| `Double-click canvas` | Fit all blocks in view |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push to the branch: `git push origin feat/my-feature`
5. Open a Pull Request

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">
  <p>Built with ❤️ using React, Hono, and TypeScript</p>
</div>
"# block-builder" 
