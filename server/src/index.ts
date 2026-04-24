// --- Environment variables loading ---
import "dotenv/config";

// --- External packages imports ---
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import type { Request, Response, NextFunction } from "express";

// --- Middlewares and errors ---
import NotFound from "./api/errors/NotFound.js";
import errorsMiddleware from "./api/middleware/errorsMiddleware.js";

// --- Database ---
import { checkConnection } from "./database/chroma.js";

// --- Providers, Services and Controllers ---
import { OpenAIEmbeddingProvider } from "./services/providers/OpenAIEmbeddingProvider.js";
import { ClaudeLLMProvider } from "./services/providers/ClaudeLLMProvider.js";
import type { LLMProvider } from "./services/providers/LLMProvider.js";
import { IngestService } from "./ingestion/ingest.js";
import { RetrieverService } from "./query/retriever.js";
import { makeIngestController } from "./api/controllers/ingestController.js";
import { makeQueryController } from "./api/controllers/queryController.js";
import { createRouter } from "./api/routes.js";

// --- Dependencies instantiation ---
const embeddingProvider = new OpenAIEmbeddingProvider();
const llmProvider: LLMProvider = new ClaudeLLMProvider();
const ingestService = new IngestService(embeddingProvider);
const retrieverService = new RetrieverService(embeddingProvider);
const ingestController = makeIngestController(ingestService);
const queryController = makeQueryController(retrieverService, llmProvider);

// --- Main initialization function ---
async function main() {
    const app = express();
    const PORT = process.env.PORT ?? 3000;

    // Global settings
    app.set('trust proxy', 1);

    // Global middlewares
    app.use(cors({
        origin: process.env.CORS_ORIGIN || '*',
    }));
    app.use(rateLimit({
        windowMs: 60_000,
        max: 30,
        message: { error: 'Too many requests, please try again later.' },
    }));
    app.use(express.json());

    // Health check route
    app.get('/health', (req: Request, res: Response) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Main API routes
    app.use('/api', createRouter({ ingestController, queryController }));

    // 404 handler route
    app.use((req: Request, res: Response, next: NextFunction): void => {
        next(new NotFound());
    });

    // Error handling middleware
    app.use(errorsMiddleware);

    // Test database connection
    await checkConnection();

    // Start HTTP server
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

// Run main function
main();