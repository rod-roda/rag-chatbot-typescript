# RAG Chatbot

Upload PDFs or text files, ask questions, and get LLM-generated answers cited against your documents. Supports multiple models (Claude and GPT-4o) with a secure authentication system.

## Architecture

```
User ──► Auth (JWT + Magic Link email)
              │
              ▼
         Express API ──► Multer (file upload)
              │
              ▼
         Loader (PDF/TXT) ──► Chunker (500 chars, 50 overlap)
              │
              ▼
         OpenAI Embeddings (text-embedding-3-small)
              │
              ▼
         ChromaDB (vectors, per-user isolation)
              │
              ▼
         Query ──► Embed question ──► Retrieve top-k chunks ──► Build prompt
              │
              ▼
         LLM Provider (Claude Sonnet 4 | Haiku 4.5 | GPT-4o | GPT-4o mini)
              │
              ▼
         Response { answer, citations[], usage }
```

**Stack:** Express 5 · TypeScript · PostgreSQL (Prisma) · ChromaDB · OpenAI Embeddings · Anthropic Claude · OpenAI GPT · Next.js 16

## Project Structure

```
├── server/                  # Backend API
│   ├── src/
│   │   ├── index.ts         # App entry: env validation, DI wiring, middleware
│   │   ├── api/
│   │   │   ├── routes.ts    # All routes with rate limiting
│   │   │   ├── controllers/ # authController, ingestController, queryController, documentsController
│   │   │   ├── errors/      # Custom error hierarchy (DefaultError → BadRequest, Unauthorized, …)
│   │   │   └── middleware/  # authMiddleware (JWT), errorsMiddleware (centralized handler)
│   │   ├── ingestion/
│   │   │   ├── loader.ts    # PDF (pdfjs) and TXT extraction + text cleaning
│   │   │   ├── chunker.ts   # Text splitting with overlap, min-length filter
│   │   │   └── ingest.ts    # Orchestrates load → chunk → embed → upsert ChromaDB
│   │   ├── query/
│   │   │   ├── retriever.ts     # Cosine similarity search (k=3, maxDistance=1.5)
│   │   │   └── promptBuilder.ts # System + user prompt with numbered excerpts
│   │   ├── services/
│   │   │   ├── emailService.ts  # Magic Link emails via nodemailer
│   │   │   └── providers/       # LLMProvider interface, Factory, Claude/OpenAI impls, EmbeddingProvider
│   │   ├── database/
│   │   │   ├── prisma.ts    # PostgreSQL client (Prisma + pg adapter)
│   │   │   └── chroma.ts    # ChromaDB client + collection helper
│   │   └── tests/           # Vitest unit tests
│   ├── prisma/
│   │   ├── schema.prisma    # User + EmailVerificationToken models
│   │   └── migrations/      # Prisma migration files
│   ├── Dockerfile
│   └── docker-compose.yml   # API + PostgreSQL + ChromaDB
└── web/                     # Frontend (Next.js 16, App Router)
    └── src/
        ├── app/
        │   ├── page.tsx          # Main hub: auth state → AuthForm or Chat+Sidebar
        │   └── verify-email/     # Magic Link callback page
        ├── components/
        │   ├── AuthForm.tsx      # Login / Register / Pending states
        │   ├── Chat.tsx          # Message thread + model selector
        │   └── Sidebar.tsx       # Document upload + context selector
        └── services/
            └── api.ts            # Typed API client with token management
```

## Getting Started

### Prerequisites

- Node.js 22+
- Docker and Docker Compose
- OpenAI API key
- Anthropic API key
- SMTP credentials (Gmail, SendGrid, etc.) for email verification

### Backend (local)

```bash
cd server
cp .env.example .env        # Fill in all variables — see table below
docker compose up -d postgres chromadb
npx prisma migrate deploy   # Run once to set up the database
npm install
npm run dev                  # Starts on port 3000
```

### Frontend (local)

```bash
cd web
echo "NEXT_PUBLIC_API_URL=http://localhost:3000/api" > .env.local
npm install
npm run dev                  # Starts on port 3001
```

### Full stack via Docker

```bash
cd server
cp .env.example .env        # Fill in all variables
docker compose up --build    # Starts API + PostgreSQL + ChromaDB
```

## Environment Variables

All variables live in `server/.env` (copy from `server/.env.example`).

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | API port (default: `3000`) |
| `OPENAI_API_KEY` | Yes | Embeddings (`text-embedding-3-small`) |
| `ANTHROPIC_API_KEY` | Yes | Claude LLM calls |
| `JWT_SECRET` | Yes | Secret for signing JWTs — use a long random string |
| `JWT_EXPIRES_IN` | No | Token lifetime (default: `7d`) |
| `DATABASE_URL` | Yes | PostgreSQL connection string (e.g. `postgresql://user:pass@host:5432/db`) |
| `POSTGRES_USER` | Yes | Used by Docker Compose to create the DB |
| `POSTGRES_PASSWORD` | Yes | PostgreSQL password |
| `POSTGRES_DB` | Yes | Database name |
| `DB_HOST` | No | ChromaDB host (default: `localhost`) |
| `DB_PORT` | No | ChromaDB port (default: `8000`) |
| `CORS_ORIGIN` | Yes | Allowed frontend origin (e.g. `https://your-app.vercel.app`) |
| `SMTP_HOST` | Yes | SMTP server (e.g. `smtp.gmail.com`) |
| `SMTP_PORT` | Yes | SMTP port (e.g. `587`) |
| `SMTP_USER` | Yes | SMTP username / email |
| `SMTP_PASS` | Yes | SMTP password / app password |
| `FROM_EMAIL` | Yes | Sender address shown in verification emails |
| `FRONTEND_URL` | Yes | Base URL used in Magic Link emails (e.g. `https://your-app.vercel.app`) |

## Auth Flow

1. **Register** — POST `/api/auth/register` with email + password. Backend sends a Magic Link email.
2. **Verify email** — User clicks the link → `GET /api/auth/verify-email?token=…` → backend validates SHA-256 token hash, marks user verified, returns a JWT.
3. **Login** — POST `/api/auth/login`. Returns JWT (blocked with 403 if email not yet verified).
4. **Authenticated requests** — All non-auth endpoints require `Authorization: Bearer <jwt>`.

Password requirements: minimum 6 chars, at least one uppercase letter, one number, one special character.

## API Endpoints

All endpoints are prefixed with `/api`.

### Auth

```
POST /auth/register      { email, password }              → 201
POST /auth/login         { email, password }              → 200 { token }
GET  /auth/verify-email  ?token=<raw_token>               → 200 { token }
```

### Documents

```
POST /ingest    Authorization: Bearer <jwt>   multipart/form-data (field: file)  → 201
GET  /documents Authorization: Bearer <jwt>                                       → 200 { documents: string[] }
```

### Query

```
POST /query   Authorization: Bearer <jwt>
              { question, fileName?: string, model?: string }
              → 200 { answer, citations[], usage: { inputTokens, outputTokens } }
```

### Models

```
GET /models   → 200 { models: [{ id, displayName }] }
```

### Example

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"Secret1!"}'

# (click magic link in email, get JWT)

# Upload a document
curl -F "file=@report.pdf" \
  -H "Authorization: Bearer <jwt>" \
  http://localhost:3000/api/ingest

# Ask a question (optionally pin to a file and select model)
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt>" \
  -d '{"question":"What are the main findings?","model":"gpt-4o"}'
```

**Query response:**
```json
{
  "answer": "According to [Excerpt 1], the main findings are…",
  "citations": [
    { "content": "…excerpt text…", "source": "abc123", "chunkIndex": 0, "distance": 0.42 }
  ],
  "usage": { "inputTokens": 512, "outputTokens": 148 }
}
```

## Supported LLM Models

| Model ID | Provider | Notes |
|---|---|---|
| `claude-sonnet-4-20250514` | Anthropic | Default |
| `claude-haiku-4-5-20251001` | Anthropic | Faster, cheaper |
| `gpt-4o` | OpenAI | |
| `gpt-4o-mini` | OpenAI | Faster, cheaper |

The model is selected per-query via the `model` field (or the UI dropdown). Embeddings always use OpenAI `text-embedding-3-small` regardless of the chosen LLM.

## Testing

```bash
cd server
npm test                                          # Full suite
npx vitest run src/tests/authController.test.ts  # Single file
npx vitest watch                                  # Watch mode
```

Coverage:
- **authController.test.ts** — registration validation, Magic Link verification, login (including email-not-verified case)
- **authMiddleware.test.ts** — JWT parsing, expired tokens, missing header
- **chunker.test.ts** — chunk size, overlap, minimum-length filtering
- **loader.test.ts** — PDF/TXT extraction, character cleaning, empty file error
- **promptBuilder.test.ts** — prompt structure, numbered excerpts, citation instructions

## Design Decisions

### Why OpenAI for embeddings + choice of LLM for generation?

OpenAI's `text-embedding-3-small` offers strong quality at low cost and is kept as the single embedding model to keep vector space consistent. The generation model is decoupled via a `LLMProvider` interface — controllers never know which provider they're calling, making it trivial to add new models.

### Why ChromaDB?

Lightweight, runs locally via Docker, no managed service required. For a project of this scope, a managed vector database would add cost and complexity without meaningful benefit.

### Why chunk size 500 with overlap 50?

500 characters balances context richness with retrieval precision. The 50-character overlap prevents information loss at chunk boundaries. Chunks under 50 characters are filtered out as they rarely carry useful content.

### Why filter by maxDistance 1.5?

Prevents returning irrelevant chunks when the question has no relation to indexed content. Without a threshold, the system would pass loosely related text to the LLM and encourage hallucination.

### Why Magic Link for email verification?

Simpler UX than a code-entry flow — one click and the user is verified. The raw token is never stored; only its SHA-256 hash lives in the database, limiting exposure if the DB is compromised. Tokens expire after 24 hours.

### Why PostgreSQL?

User accounts and verification tokens require relational guarantees (foreign keys, unique constraints, atomic updates). ChromaDB handles vectors; PostgreSQL handles identity.

### Error hierarchy

```
DefaultError (500)
├── BadRequest (400)
│   └── EmptyDocumentError
├── Unauthorized (401)
├── Forbidden (403)
├── NotFound (404)
└── BadGateway (502)
    ├── OpenAIError
    ├── AnthropicError
    └── SmtpError
```

Every error flows through a single middleware. External API failures map to 502 (the server is healthy; the upstream dependency failed). This keeps controller code clean and responses consistent.

### Rate limiting

Auth endpoints: 10 req / 15 min. Global: 30 req / min. Protects paid API usage even in demo environments.

### Security highlights

- Bcrypt password hashing (10 rounds)
- JWT stateless auth (7-day expiry by default)
- Verification tokens stored as SHA-256 hashes only
- Helmet security headers
- CORS restricted to configured origin
- File type/size validation via Multer (PDF/TXT, 10 MB max)
- Non-root user in Docker image
- Temporary file cleanup guaranteed on both success and error paths

## Deployment

| Service | Platform | Config |
|---|---|---|
| Frontend | Vercel | Root directory: `web` |
| Backend API | Railway | Root directory: `server`, uses `Dockerfile` |
| PostgreSQL | Railway | Add a PostgreSQL service |
| ChromaDB | Railway | Docker image: `chromadb/chroma:latest` |

### Railway — required environment variables

In addition to API keys already set, add:

```
JWT_SECRET=<long random string>
JWT_EXPIRES_IN=7d

# From the Railway PostgreSQL service (auto-filled if using Railway Postgres)
DATABASE_URL=postgresql://...

# ChromaDB service internal URL
DB_HOST=<chromadb-service-host>
DB_PORT=8000

# SMTP — use Gmail App Password or SendGrid / Resend
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=<app-password>
FROM_EMAIL=noreply@yourdomain.com

# Must match your production Vercel URL
FRONTEND_URL=https://your-app.vercel.app
CORS_ORIGIN=https://your-app.vercel.app
```

Migrations run automatically on container start (`prisma migrate deploy` in the Dockerfile entrypoint).

### Vercel — required environment variables

```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api
```
