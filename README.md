# Synthesis

> Your design library should build itself.

Desktop + web tool for designers to capture UI components and flows, organized into an AI-sorted reference library.

Capture screenshots from any app on your Mac with a global hotkey, and Synthesis automatically analyzes them with AI (GPT-4o Vision) and makes them searchable via natural language.

## Tech Stack

| Layer         | Technology                                               |
| ------------- | -------------------------------------------------------- |
| Monorepo      | pnpm workspaces + Turborepo                              |
| Web App       | Next.js (T3-style)                                       |
| Desktop App   | Electron Forge + Vite                                    |
| Shared UI     | React + Tailwind + shadcn/ui                             |
| API           | tRPC                                                     |
| Database      | Prisma + Neon (PostgreSQL)                               |
| Image Storage | Uploadthing                                              |
| AI            | OpenAI GPT-4o Vision + text-embedding-3-small (pgvector) |
| Auth          | Clerk                                                    |

## Repo Structure

```
synthesis/
├── apps/
│   ├── web/                  # Next.js — web app + API + landing page
│   └── desktop/              # Electron Forge + Vite — desktop app
├── packages/
│   ├── ui/                   # Shared React + Tailwind + shadcn components
│   ├── api/                  # tRPC router definitions & types
│   └── db/                   # Prisma schema + client (Neon)
├── turbo.json                # Turborepo pipeline config
├── pnpm-workspace.yaml       # Workspace definitions
└── package.json              # Root workspace config
```

### Package Responsibilities

- **`packages/ui`** — All shared React components. Both apps import from `@synthesis/ui`. Single source of truth for the design system.
- **`packages/api`** — tRPC router definitions and Zod input schemas. Imported by `apps/web` (server) and `apps/desktop` (typed client).
- **`packages/db`** — Prisma schema, client, and migrations. **Only used server-side by `apps/web`** — the desktop app never imports this.

## Prerequisites

- **Node.js** >= 20
- **pnpm** >= 9 (`corepack enable && corepack prepare pnpm@latest --activate`)
- A [Neon](https://neon.tech) PostgreSQL database
- A [Clerk](https://clerk.com) application
- An [Uploadthing](https://uploadthing.com) project
- An [OpenAI](https://platform.openai.com) API key

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/Vortes/synthesis.git
cd synthesis
pnpm install
```

### 2. Set up environment variables

**`apps/web/.env.local`**

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SECRET="whsec_..."

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/library
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/library

# Neon
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

# Uploadthing
UPLOADTHING_TOKEN="..."

# OpenAI
OPENAI_API_KEY="sk-proj-..."
```

**`apps/desktop/.env`**

```env
# Web app URL (for tRPC calls and browser-redirect auth)
VITE_WEB_URL="http://localhost:3000"

# Clerk
VITE_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Uploadthing
UPLOADTHING_TOKEN="..."

# Neon (used by Prisma generate only)
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

# OpenAI
OPENAI="sk-proj-..."
```

### 3. Generate the Prisma client

```bash
pnpm turbo db:generate
```

### 4. Run in development

```bash
# Both apps
pnpm dev

# Web only (http://localhost:3000)
pnpm dev:web

# Desktop only (Electron window)
pnpm dev:desktop
```

## Architecture Overview

### Data Flow

```
Electron App  ──HTTP──▶  Next.js (apps/web)  ──Prisma──▶  Neon Postgres
(user's Mac)              /api/trpc route                   (cloud DB)
```

- The Electron app **never** connects to the database directly.
- Database credentials live only on the server (Next.js env vars).
- Electron calls tRPC endpoints over HTTP to the deployed web app.

### tRPC Consumption

| Consumer                       | Method                            | Network hop? |
| ------------------------------ | --------------------------------- | ------------ |
| `apps/web` — server components | Direct caller (in-process)        | None         |
| `apps/web` — client components | React Query via Next.js API route | Internal     |
| `apps/desktop` — renderer      | HTTP client → `apps/web/api/trpc` | Yes          |

### Web App Routes

```
apps/web/src/app/
├── (marketing)/          # Landing page — public
├── (app)/                # Web app — authenticated (library, collections)
└── api/trpc/[trpc]/      # tRPC API endpoint
```

### Electron Architecture

- **Main process** (`src/main.ts`) — Node.js with full OS access: global shortcuts, screen capture, IPC, window management.
- **Renderer process** (`src/renderer/`) — Chromium browser window running the React app. No direct Node.js access.
- **Preload script** (`src/preload.ts`) — Bridge between main and renderer via `contextBridge`.

### Screenshot Capture Flow

```
User presses capture hotkey (Cmd+Shift+S)
  → Electron overlay appears (transparent fullscreen window)
  → User drags to select a region
  → Screenshot captured
  → Uploaded via Uploadthing (tRPC endpoint)
  → Metadata saved to Neon (tRPC mutation → Prisma)
  → AI analysis triggered (GPT-4o Vision) → description + embedding stored
  → Floating thumbnail preview appears (auto-dismisses after 5s)
```

## Scripts

| Command                  | Description                    |
| ------------------------ | ------------------------------ |
| `pnpm dev`               | Start both apps in development |
| `pnpm dev:web`           | Start the web app only         |
| `pnpm dev:desktop`       | Start the desktop app only     |
| `pnpm build`             | Build all packages and apps    |
| `pnpm lint`              | Lint all packages and apps     |
| `pnpm turbo db:generate` | Regenerate Prisma client       |

## Deployment

- **Web + API + Landing** → Vercel (root directory: `apps/web`, framework: Next.js)
- **Desktop** → Electron Forge → GitHub Releases (`.dmg` for macOS)

## Further Reading

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — Full technical decisions, key decisions log, and build phases
- [`Product.md`](./Product.md) — Product strategy and feature roadmap
