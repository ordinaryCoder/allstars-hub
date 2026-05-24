# Allstars Hub

A monorepo for the Allstars Hub application, built with Next.js, Prisma, and Supabase, managed via `pnpm` workspaces.

## 📁 Folder Structure

    /allstars-hub
    ├── .gitignore
    ├── package.json
    ├── pnpm-workspace.yaml
    ├── node_modules/              
    ├── apps/
    │   └── web/                   
    │       ├── package.json
    │       ├── node_modules/      
    │       └── (Next.js app files)
    └── packages/
        ├── database/              
        │   ├── package.json
        │   ├── node_modules/      
        │   ├── index.ts           
        │   └── prisma/
        │       └── schema.prisma
        └── supabase/              
            ├── package.json
            ├── node_modules/      
            └── supabase/
                └── config.toml

## 🛠️ Prerequisites

*   Node.js
*   `pnpm`
*   Supabase CLI (installed via Scoop for Windows recommended)

## 🚀 Setup Instructions

1.  **Install dependencies** from the root directory:
    ```bash
    pnpm install
    ```

2.  **Database Setup:** Navigate to the database package and generate the Prisma client.
    ```bash
    cd packages/database
    pnpm prisma generate
    ```

3.  **Run Development Server:** Start the Next.js frontend from the root directory.
    ```bash
    pnpm --filter web dev
    ```

## 🗄️ Database & Supabase Workflow

This project separates database management into two distinct parts: **Prisma** handles the schema (tables and columns), and the **Supabase CLI** handles platform-specific features (Row Level Security policies, webhooks).

### 1. Local Development
Start the local Supabase container:
```bash
cd packages/supabase
supabase start
```

Push the current Prisma schema to your local database to test tables locally:

Bash
cd packages/database
pnpm prisma db push
2. Deploying to Cloud (Dev or Prod)
Step A: Schema (Prisma)
Ensure your .env file in packages/database points to the target Cloud Project's DATABASE_URL. Then, apply migrations to update the tables:

Bash
cd packages/database
pnpm prisma migrate deploy
Step B: Policies & Config (Supabase)
Link the CLI to your target Cloud Project and push your platform-specific settings (like RLS):

Bash
cd packages/supabase
supabase link --project-ref <your-project-id>
supabase db push --linked

### Topics to Explore
* Vercel deployment commands
* Handling `.env` variables across workspaces
* Seeding local databases with test data


------------------------------------TODO: Remove later
allstars-hub/ (pnpm monorepo root)
│
├── apps/web/                          # Next.js frontend application
│   ├── app/                           # App Router (Next.js 16)
│   │   ├── api/attendance/route.ts    # API endpoint for attendance
│   │   ├── layout.tsx                 # Root layout
│   │   ├── page.tsx                   # Home page
│   │   └── globals.css                # Global styles
│   ├── lib/                           # Shared utilities
│   │   ├── client.ts                  # Browser Supabase client
│   │   └── supabase.ts                # Token verification & JWT
│   ├── public/                        # Static assets
│   ├── package.json                   # Web dependencies
│   ├── next.config.ts                 # Transpiles @packages/database
│   ├── tsconfig.json                  # Path aliases
│   └── .env.local                     # Supabase credentials (local)
│
├── packages/database/                 # Prisma ORM package
│   ├── prisma/
│   │   └── schema.prisma              # Database schema (PostgreSQL)
│   ├── generated/prisma/              # Auto-generated Prisma client
│   ├── index.ts                       # Exports Prisma + RLS utility
│   ├── package.json                   # @packages/database
│   ├── prisma.config.ts               # Prisma configuration
│   └── .env                           # DATABASE_URL & DIRECT_URL
│
├── packages/supabase/                 # Supabase CLI configuration
│   ├── supabase/config.toml           # Local Supabase config
│   └── package.json
│
├── supabase/                          # Root Supabase config (git-tracked)
│   ├── snippets/                      # SQL files (RLS policies)
│   └── .temp/                         # Temp files (git-ignored)
│
└── root files/
    ├── pnpm-workspace.yaml            # Workspace definitions
    ├── package.json                   # Root scripts
    ├── .env                           # Root env variables
    └── .gitignore                     # Git ignore rules


UI initial folder structure

apps/web/
├── app/
│   ├── (auth)/           # Group for login/signup
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/      # Protected coach screens
│   │   ├── layout.tsx    # Sidebar/Nav here
│   │   ├── page.tsx      # Coach Home
│   │   ├── roster/
│   │   │   └── page.tsx
│   │   └── reports/
│   │       └── page.tsx
│   ├── api/              # Route handlers (if needed)
│   │   └── auth/
│   └── layout.tsx        # Root providers
├── components/
│   ├── ui/               # Buttons, Inputs (shadcn)
│   ├── features/         # AttendanceList, SessionCard
│   └── shared/           # Navbar, Sidebar
├── lib/
│   ├── supabase/         # client.ts, server.ts, middleware.ts
│   └── utils.ts
└── proxy.ts         # refresh session