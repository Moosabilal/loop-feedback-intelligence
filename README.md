# LOOP: Customer-Feedback Intelligence Platform

LOOP is a B2B SaaS platform designed to ingest, analyze, and report on customer feedback. Using generative AI, LOOP automates the classification of qualitative feedback, detects trending themes in real-time, provides a conversational RAG interface for querying feedback history, and generates executive-ready Voice-of-Customer reports.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Database**: PostgreSQL (via Supabase or Neon) with `pgvector` for embeddings
- **ORM**: Prisma
- **Authentication**: NextAuth.js (Credentials provider + JWT session)
- **AI Backend**: Google Gemini (`@google/generative-ai`), defaulting to `gemini-3.1-flash-lite`

## Architecture

LOOP is built on a strict n-tier architecture tailored for multi-tenant B2B SaaS:

1. **Routing Layer** (Next.js App Router): Handles incoming requests, HTTP methods, and React Server Components.
2. **Service Layer** (`src/lib/services/`): Pure TypeScript classes containing business logic. Fully decoupled from Next.js specifics.
3. **Repository Layer** (`src/lib/repositories/`): Data access layer extending a base `TenantScopedRepository` to guarantee that all database queries are strictly scoped to the active user's `workspaceId`.
4. **AI Abstraction** (`src/lib/interfaces/IAIProvider.ts`): The AI provider is abstracted behind an interface, allowing seamless swapping of underlying LLM engines. `GoogleAIProvider` is the permanent, primary engine driving the application.

## Local Setup

### 1. Prerequisites
- Node.js 18+
- A PostgreSQL database with `pgvector` enabled (e.g., Supabase)
- A Google Gemini API Key

### 2. Environment Variables
Clone the repository and create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

Ensure the following variables are populated in your `.env`:
- `DATABASE_URL`: Connection string for Prisma migrations and standard queries.
- `DIRECT_URL`: Direct connection string for Prisma (often used for migrations in pooled environments like Supabase).
- `NEXTAUTH_SECRET`: A secure random string (e.g., generate via `openssl rand -base64 32`).
- `NEXTAUTH_URL`: `http://localhost:3000`
- `AI_PROVIDER`: `google`
- `GOOGLE_AI_API_KEY`: Your Gemini API key.
- `ANTHROPIC_API_KEY`: (Optional) Set `AI_PROVIDER=anthropic` and provide this key to use Claude instead of Gemini.

### 3. Database Initialization
Run the Prisma migrations to create the schema, including the `pgvector` extension:
```bash
npx prisma migrate deploy
```

Generate the Prisma client:
```bash
npx prisma generate
```

### 4. Seed the Database
Seed the database with a realistic demo workspace, themes, and 120 historical feedback items:
```bash
npm run seed
```

### 5. Run the Application
Start the Next.js development server:
```bash
npm run dev
```
Navigate to `http://localhost:3000` to view the app.

## Demo Credentials

The `npm run seed` command provisions a demo workspace with three distinct roles. Use the following credentials to explore the Role-Based Access Control (RBAC):

- **Admin Account**: 
  - Email: `admin@acme.com`
  - Password: `loop123`
  - *Capabilities: Full access (simulate feedback, manage members, generate reports, use Ask LOOP).*
- **Analyst Account**: 
  - Email: `analyst@acme.com`
  - Password: `loop123`
  - *Capabilities: Analyze feedback, generate reports, use Ask LOOP. Cannot manage members.*
- **Viewer Account**: 
  - Email: `viewer@acme.com`
  - Password: `loop123`
  - *Capabilities: Read-only access to dashboards and Ask LOOP. Cannot simulate feedback or generate reports.*

## Screenshots

> **TODO (Step 4.6):** Capture and insert real screenshots of the final UI for the Dashboard, Inbox, Ask LOOP, and Reports.

- `[Screenshot: Dashboard overview highlighting sentiment and volume charts]`
- `[Screenshot: Feedback inbox demonstrating AI auto-classification]`
- `[Screenshot: Ask LOOP conversational RAG interface]`
- `[Screenshot: Auto-generated Voice of Customer report]`
