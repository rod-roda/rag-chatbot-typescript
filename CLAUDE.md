# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A full-stack RAG (Retrieval-Augmented Generation) chatbot. Users upload PDF/TXT documents, which are chunked, embedded via OpenAI, and stored in ChromaDB. Queries are answered by Claude Sonnet using retrieved context as grounding.

Monorepo with two independent packages:
- `server/` — Express 5 + TypeScript backend
- `web/` — Next.js 16 (App Router) frontend

## Commands

### Backend (`server/`)
```bash
npm run dev          # Start with tsx (live reload)
npm run start        # Production start
npm test             # Run full Vitest suite
npx vitest run src/tests/<file>.test.ts  # Single test file
npx vitest watch     # Watch mode
npx prisma migrate deploy  # Apply DB migrations
npx prisma generate        # Regenerate Prisma client
```

### Frontend (`web/`)
```bash
npm run dev          # Start on port 3001
npm run build        # Production build
npm run lint         # ESLint
```

### Docker (from `server/`)
```bash
docker compose up --build    # Full stack (API + ChromaDB)
docker compose up chromadb   # ChromaDB only
```

## Architecture

### Request Flow (Backend)

1. **Auth middleware** validates JWT Bearer token, injects `req.userId`
2. **Ingest pipeline**: Multer upload → extract text (pdfjs/txt) → clean → chunk (500 chars, 50 overlap) → batch embed (OpenAI) → upsert to ChromaDB with `{fileName, userId, chunkIndex}` metadata
3. **Query pipeline**: embed question → ChromaDB cosine search (distance < 1.5, filtered by `userId`) → build prompt with context excerpts → Claude Sonnet → return answer + citations + token usage

Re-uploads delete old chunks before re-indexing. File cleanup is guaranteed in both success/error paths.

### Error Hierarchy

Custom error classes in `src/api/errors/` with a `sendResponse()` method, caught by centralized middleware:

```
DefaultError (500)
├── BadRequest (400) → EmptyDocumentError
├── Unauthorized (401)
├── Forbidden (403)
├── NotFound (404)
└── BadGateway (502) → OpenAIError, AnthropicError
```

### Auth Flow

Registration → email sent with Magic Link (`${FRONTEND_URL}/verify-email?token=...`) → user clicks link → frontend page calls `GET /api/auth/verify-email?token=...` → backend verifies SHA256 token hash, sets `emailVerified=true`, returns JWT → frontend saves JWT and redirects to `/`. Login is blocked (HTTP 403) if email not yet verified. JWT expires in 7d by default. See `src/api/controllers/authController.ts`, `src/services/emailService.ts`, and `web/src/app/verify-email/page.tsx`.

### Provider Abstraction

`LLMProvider` and `EmbeddingProvider` interfaces live in `src/services/providers/`. Controllers receive these via constructor injection — swap implementations without touching callers. Current implementations: `ClaudeLLMProvider` (Anthropic SDK) and `OpenAIEmbeddingProvider`.

### Frontend

Single-page app (`web/src/app/page.tsx`) with two modes controlled by JWT presence in localStorage: auth mode (AuthForm) and chat mode (Chat + Sidebar). AuthForm has three internal states: `login`, `register`, and `pending` (post-registration "check your inbox" screen). The `/verify-email` route (`web/src/app/verify-email/page.tsx`) handles Magic Link callbacks. API client at `web/src/services/api.ts` auto-logouts on 401. `refreshTrigger` state counter causes Sidebar to re-fetch documents after upload.

## Databases

- **ChromaDB** (Docker, port 8000): vector storage, single collection `"documents"`, multi-tenant via `userId` metadata filter
- **SQLite** (Prisma + better-sqlite3): `User` and `EmailVerificationToken` models, file at `prisma/dev.db`, client generated to `src/generated/prisma`

## Environment Variables

Copy `server/.env.example` and fill in:

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | Embeddings (text-embedding-3-small) |
| `ANTHROPIC_API_KEY` | LLM (claude-sonnet-4-20250514) |
| `JWT_SECRET` | Token signing |
| `DATABASE_URL` | SQLite path (default: `file:./dev.db`) |
| `DB_HOST` / `DB_PORT` | ChromaDB connection (default: localhost:8000) |
| `SMTP_*` / `FROM_EMAIL` | Email sending (SMTP config) |
| `FRONTEND_URL` | Base URL for Magic Link in verification emails (default: `http://localhost:3001`) |

Frontend needs `NEXT_PUBLIC_API_URL=http://localhost:3000/api`.

## Key Design Decisions

- **Rate limiting**: 30 req/min per IP to protect paid API usage
- **Chunk filtering**: chunks < 50 chars are discarded; cosine distance ≥ 1.5 excluded from context
- **TypeScript strict mode** across both packages
- **Tests** use Vitest with no DB/external mocks — auth middleware tests mock `jsonwebtoken` directly
