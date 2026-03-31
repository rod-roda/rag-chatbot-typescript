# RAG Chatbot

Upload PDFs or text files, index chunks, and get LLM answers with cited snippets via a simple API.

## Architecture

```
User ──► Express API ──► Multer (file upload)
              │
              ▼
         Loader (PDF/TXT)
              │
              ▼
         Chunker (500 chars, 50 overlap)
              │
              ▼
         OpenAI Embeddings (text-embedding-3-small)
              │
              ▼
         ChromaDB (vector storage)
              │
              ▼
         Query ──► Embed question ──► Retrieve top-k chunks ──► Build prompt ──► Claude (claude-sonnet-4-20250514)
              │
              ▼
         Response { answer, citations[], usage }
```

**Stack:** Express 5 · TypeScript · ChromaDB · OpenAI Embeddings · Anthropic Claude · Next.js (frontend)

## Project Structure

```
├── server/                  # Backend API
│   ├── src/
│   │   ├── index.ts         # Express app entry point
│   │   ├── api/
│   │   │   ├── routes.ts    # POST /ingest, POST /query
│   │   │   ├── controllers/ # Request handling logic
│   │   │   ├── errors/      # Custom error hierarchy
│   │   │   └── middleware/   # Centralized error handler
│   │   ├── ingestion/
│   │   │   ├── loader.ts    # PDF and TXT text extraction
│   │   │   ├── chunker.ts   # Text splitting with overlap
│   │   │   └── ingest.ts    # Orchestrates load → chunk → embed → store
│   │   ├── query/
│   │   │   ├── retriever.ts # Vector similarity search
│   │   │   ├── promptBuilder.ts # System + user prompt assembly
│   │   │   └── llm.ts       # Claude API call
│   │   ├── services/        # External API clients (OpenAI, Anthropic)
│   │   ├── database/        # ChromaDB connection
│   │   └── tests/           # Unit tests (Vitest)
│   ├── Dockerfile
│   └── docker-compose.yml
└── web/                     # Frontend (Next.js)
    └── src/
        ├── app/             # App Router pages
        ├── components/      # FileUpload, Chat
        └── services/        # API client functions
```

## Getting Started

### Prerequisites

- Node.js 22+
- Docker and Docker Compose (for ChromaDB)
- OpenAI API key
- Anthropic API key

### Backend

```bash
cd server
cp .env.example .env        # Fill in your API keys
docker compose up chromadb   # Start ChromaDB
npm install
npm run dev                  # Starts on port 3000
```

### Frontend

```bash
cd web
npm install
npm run dev                  # Starts on port 3001
```

### Full Stack via Docker

```bash
cd server
cp .env.example .env        # Fill in your API keys
docker compose up --build    # Starts API + ChromaDB
```

## API Endpoints

### `POST /api/ingest`

Upload a PDF or TXT file to be indexed.

```bash
curl -F "file=@document.pdf" http://localhost:3000/api/ingest
```

**Response:**
```json
{ "message": "Documento processado e vetores salvos com sucesso" }
```

### `POST /api/query`

Ask a question about the indexed documents.

```bash
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"question": "What does the document say about X?"}'
```

**Response:**
```json
{
  "answer": "According to the document [Trecho 1], ...",
  "citations": [
    { "content": "...", "source": "abc123", "chunkIndex": 0 }
  ],
  "usage": { "inputTokens": 512, "outputTokens": 150 }
}
```

## Design Decisions

### Why OpenAI for embeddings + Anthropic for generation?

OpenAI's `text-embedding-3-small` offers strong embedding quality at low cost. Claude Sonnet excels at following instructions precisely — critical for a RAG system where the model must stay grounded in the provided context and cite sources accurately.

### Why ChromaDB?

Lightweight, runs locally via Docker, and has a simple JS client. For a project of this scope, a managed vector database (Pinecone, Weaviate) would add infrastructure complexity without meaningful benefit.

### Why chunk size 500 with overlap 50?

500 characters balances context richness with retrieval precision — short enough to be specific, long enough to carry meaning. The 50-character overlap prevents information loss at chunk boundaries. Chunks under 50 characters are filtered out as they rarely contain useful content.

### Why filter by maxDistance 1.5?

Cosine distance threshold to avoid returning irrelevant chunks when the user's question doesn't relate to any indexed content. Without this, the system would hallucinate answers from loosely related text.

### Why a custom error hierarchy?

```
DefaultError (500)
├── BadRequest (400)
│   └── EmptyDocumentError (400)
├── NotFound (404)
└── BadGateway (502)
    ├── OpenAIError (502)
    └── AnthropicError (502)
```

Every error flows through a single middleware. External API failures map to 502 (Bad Gateway) because the server itself is working correctly — the upstream dependency failed. This keeps error responses consistent and the controller code clean.

### Why rate limiting?

30 requests/minute per IP. Since the API calls paid external services (OpenAI, Anthropic), uncontrolled access could generate significant costs. Even for a demo, this is a deliberate security choice.

## Testing

```bash
cd server
npm test
```

17 tests across 3 files covering the core logic:
- **chunker.test.ts** — chunk size, overlap, filtering, edge cases
- **loader.test.ts** — text loading, cleaning, empty file handling
- **promptBuilder.test.ts** — prompt structure, chunk formatting, citation instructions

## Deployment

- **Frontend:** Vercel (Root Directory: `web`)
- **Backend:** Railway (Root Directory: `server`, uses Dockerfile)
- **ChromaDB:** Railway (Docker Image: `chromadb/chroma:latest`)

Environment variables are configured per-platform — no secrets in the repository.


## Additional Notes

### API endpoint for listing indexed documents

Although the challenge only requires an API, this project includes a frontend for demonstration purposes. To support the UI (and future integrations), the backend exposes a `GET /api/documents` endpoint that lists all unique file names currently indexed in ChromaDB. This endpoint is optional and does not affect the core API functionality. It is a common practice in real-world APIs to provide such endpoints for better integration and user experience.

### What happens if a non-existent fileName is queried?

If the user queries the API with a `fileName` that does not exist in the database, the system simply returns an empty result (no chunks/snippets found). This does not cause errors or break the API; the LLM will respond that no relevant information was found. This behavior is intentional and robust, ensuring the API remains stable regardless of user input.
