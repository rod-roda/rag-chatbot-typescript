// --- Carregamento de variáveis de ambiente ---
import "dotenv/config";

// --- Importações de pacotes externos ---
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import type { Request, Response, NextFunction } from "express";

// --- Middlewares e erros ---
import NotFound from "./api/errors/NotFound.js";
import errorsMiddleware from "./api/middleware/errorsMiddleware.js";

// --- Banco de dados ---
import { checkConnection } from "./database/chroma.js";

// --- Providers, Services e Controllers ---
import { OpenAIEmbeddingProvider } from "./services/providers/OpenAIEmbeddingProvider.js";
import { ClaudeLLMProvider } from "./services/providers/ClaudeLLMProvider.js";
import type { LLMProvider } from "./services/providers/LLMProvider.js";
import { IngestService } from "./ingestion/ingest.js";
import { RetrieverService } from "./query/retriever.js";
import { makeIngestController } from "./api/controllers/ingestController.js";
import { makeQueryController } from "./api/controllers/queryController.js";
import { createRouter } from "./api/routes.js";

// --- Instância de dependências ---
const embeddingProvider = new OpenAIEmbeddingProvider();
const llmProvider: LLMProvider = new ClaudeLLMProvider();
const ingestService = new IngestService(embeddingProvider);
const retrieverService = new RetrieverService(embeddingProvider);
const ingestController = makeIngestController(ingestService);
const queryController = makeQueryController(retrieverService, llmProvider);

// --- Função principal de inicialização ---
async function main() {
    const app = express();
    const PORT = process.env.PORT ?? 3000;

    // Configurações globais
    app.set('trust proxy', 1);

    // Middlewares globais
    app.use(cors({
        origin: process.env.CORS_ORIGIN || '*',
    }));
    app.use(rateLimit({
        windowMs: 60_000,
        max: 30,
        message: { error: 'Too many requests, please try again later.' },
    }));
    app.use(express.json());

    // Health check
    app.get('/health', (req: Request, res: Response) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Rotas principais
    app.use('/api', createRouter({ ingestController, queryController }));

    // Rota 404
    app.use((req: Request, res: Response, next: NextFunction): void => {
        next(new NotFound());
    });

    // Middleware de tratamento de erros
    app.use(errorsMiddleware);

    // Testa conexão com o banco
    await checkConnection();

    // Inicializa o servidor
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

// Executa a função principal
main();