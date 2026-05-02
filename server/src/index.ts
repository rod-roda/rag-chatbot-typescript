// --- Environment variables loading ---
import "dotenv/config";

// --- Startup validation ---
//const REQUIRED_ENV = ['JWT_SECRET', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'RESEND_API_KEY'] as const;
const REQUIRED_ENV = ['JWT_SECRET', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'FROM_EMAIL'] as const;
for (const key of REQUIRED_ENV) {
    if (!process.env[key]) {
        console.error(`Missing required environment variable: ${key}`);
        process.exit(1);
    }
}

// --- External packages imports ---
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import type { Request, Response, NextFunction } from "express";

// --- Middlewares and errors ---
import NotFound from "./api/errors/NotFound.js";
import errorsMiddleware from "./api/middleware/errorsMiddleware.js";

// --- Database ---
import { checkConnection } from "./database/chroma.js";

// --- Providers, Services and Controllers ---
import { OpenAIEmbeddingProvider } from "./services/providers/OpenAIEmbeddingProvider.js";
import { LLMProviderFactory } from "./services/providers/LLMProviderFactory.js";
import { IngestService } from "./ingestion/ingest.js";
import { RetrieverService } from "./query/retriever.js";
import { makeIngestController } from "./api/controllers/ingestController.js";
import { makeQueryController } from "./api/controllers/queryController.js";
import { createRouter } from "./api/routes.js";

// --- Dependencies instantiation ---
const embeddingProvider = new OpenAIEmbeddingProvider();
const llmFactory = new LLMProviderFactory();
const ingestService = new IngestService(embeddingProvider);
const retrieverService = new RetrieverService(embeddingProvider);
const ingestController = makeIngestController(ingestService);
const queryController = makeQueryController(retrieverService, llmFactory);

// --- Main initialization function ---
async function main() {
    const app = express();
    const PORT = process.env.PORT ?? 3000;

    // Global settings
    app.set('trust proxy', 1);

    // Global middlewares
    app.use(helmet());
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
