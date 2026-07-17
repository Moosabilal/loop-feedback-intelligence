# LOOP Build Log

This document tracks our progress through the strict, step-gated build phases of the LOOP AI Customer-Feedback Intelligence Platform.

## Phase 0: Kickoff & Environment

- **Step 0.1 - Confirm Scope and Stack**: Confirmed the Next.js 14 stack, four AI features, and four milestones. Verified presence of PostgreSQL connection string, Anthropic API key, and Vercel account.
- **Step 0.2 - Scaffold the App**: Created Next.js + TypeScript + Tailwind app, installed dependencies (`prisma`, `next-auth`, `@anthropic-ai/sdk`, etc.), created `.env.example` and `.gitignore`. Successfully deployed to Vercel and proved CI/CD pipeline.
- **Step 0.3 - Establish Project Conventions**: Added ESLint + Prettier config, established the `src/lib` folder skeleton for the OOP service layer (`services/`, `repositories/`, `interfaces/`, `container.ts`), and created this `BUILD_LOG.md`. (Includes bug fix for ESLint/Prettier on `fix/p0-3-eslint-config`).
- **Step 0.4 - Establish Git Workflow**: Confirmed origin remote and `main` branch. Demonstrated the step-gated git workflow (branch, trivial change, commit, push, wait for approval, merge).

## Phase 1: Foundation & Data Layer

- **Step 1.1 - Prisma Schema**: Designed and migrated the Prisma schema for Workspace, User, Feedback, Theme, FeedbackTheme, Embedding, and Report, strictly adhering to `workspaceId` tenant scoping. Configured Supabase pooled and direct connection strings.
- **Step 1.2 - Seed Script**: Built `prisma/seed.ts` utilizing `bcryptjs` for secure password hashing. Successfully seeded a demo workspace with 3 users (ADMIN, ANALYST, VIEWER), 8 themes, and 120 feedback items logically distributed and historically dated.
- **Step 1.3 - Authentication (NextAuth)**: Configured NextAuth Credentials provider using a stateless JWT session strategy. Implemented strict server-side Zod validation and transactional Workspace + User creation via `AuthService`. Attached `role` and `workspaceId` to the session JWT for multi-tenant RBAC. Secured routes using Next.js middleware and implemented cinematic UI for `/login` and `/signup`.
- **Step 1.4 - Workspaces + RBAC Foundation**: Built `TenantScopedRepository` base class guaranteeing workspace isolation across domain repos. Implemented `AuthorizationService` for strict server-side role enforcement (returning 403 Forbidden). Built the admin-only member invite flow (`AuthService.inviteMember`) and `/settings/members` dashboard view.
- **Step 1.5 - Basic Feedback CRUD (Milestone 1)**: Built Feedback CRUD, enforced channels via Zod enum, restricted POST to ADMIN/ANALYST via AuthorizationService, implemented cinematic Inbox UI, and added a reusable ConfirmModal for logout. Milestone 1 verified.

## Phase 2: Core Data Workflows

- **Step 2.1 - CSV Bulk Upload**: Implemented bulk upload via `papaparse` on the client, validated on the server with Zod. Strictly mapped headers, enforced a `<5MB` / `<5,000` rows limit, injected `workspaceId` server-side, and built a cinematic drag-and-drop modal with template generation and per-row error reporting. Made `prisma/seed.ts` idempotent.
- **Step 2.2 - Channel Ingestion (Simulation)**: Implemented simulated integration ingestion. Created `POST /api/integrations/simulate` strictly scoped to ADMIN/ANALYST roles. Built a custom `FeedbackGenerator` utilizing sentence fragments and a `Set` to prevent duplicate generation. Added a sleek "Simulate Channel" dropdown to the Inbox UI, hidden from viewers.
- **Step 2.3 - Feedback Inbox**: Upgraded the static inbox to a dynamic triage tool. Implemented server-side, offset-based pagination and full-text search clamped by strict server limits. Added an optimistic UI for inline status updates (`NEW` → `REVIEWED` → `ACTIONED`) that falls back gracefully on error. Replaced native browser alerts with a globally available, animated custom Toast system.
- **Step 2.4 - Dashboard Charts (Milestone 2)**: Built the dashboard visual centerpiece. Implemented Recharts-based volume, sentiment, and theme charts, alongside three stat cards. Designed a robust empty state for new workspaces. Set up the API structure to return a mix of real data (using Prisma aggregations for volume/counts) and mock data (for AI-dependent sentiment/themes), ensuring a zero-rewrite swap in Phase 3.

## Phase 3: AI Integration

- **Step 3.1 - AI Service Wiring**: Designed the generic `IAIProvider` interface wrapping all AI operations (`generateText`, `generateStructured`, `generateEmbedding`) to decouple domain logic from vendor specifics. Implemented `AnthropicAIProvider` as the primary engine and created `GoogleAIProvider` (via `@google/generative-ai` with `gemini-flash-latest`) as a temporary fallback to unblock development while waiting for Anthropic keys. **Important**: The `GoogleAIProvider` is strictly a stopgap; it must be swapped for `AnthropicAIProvider` (via the `AI_PROVIDER` env var) before final delivery. Ensured strict security by enforcing Next.js `server-only` execution on all providers.
- **Step 3.2 - Auto-classification (AI1)**: Integrated the classification engine. Added `ClassificationService` to automatically analyze incoming feedback via the active AI provider, returning strict Zod-validated JSON containing sentiment, score, feature area, rationale, and themes. Wired this into both single-item creation and a robust background batch endpoint (`/api/feedback/classify-batch`) with provider-level rate limiting, a 3-consecutive-failure circuit breaker, and defensive snake_case normalization. UI now displays rich AI metadata in the inbox and supports on-demand re-classification. **Note**: Still temporarily using `gemini-3.1-flash-lite` for rate-limit testing until Anthropic keys arrive.
