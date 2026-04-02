import type { Request, Response, NextFunction } from "express";
import { retrieveChunks } from "../../query/retriever.js";
import { buildPrompt, type BuiltPrompt } from "../../query/promptBuilder.js";
import { askClaude } from "../../query/llm.js";
import BadRequest from "../errors/BadRequest.js";
import NotFound from "../errors/NotFound.js";

export async function queryController(req: Request, res: Response, next: NextFunction): Promise<void>
{
    try {
        if (!req.is('application/json')) {
            next(new BadRequest('Content-Type must be application/json'));
            return;
        }

        if (!req.body) {
            next(new BadRequest('Request body is required'));
            return;
        }

        const { question, fileName } = req.body;

        if(!question || question.trim().length < 5){
            next(new BadRequest('Question too short or not provided'));
            return;
        }

        const chunks = await retrieveChunks(question, 3, 1.5, fileName);
        if(chunks.length === 0){
            next(new NotFound('No relevant information found in the document'));
            return;
        }

        const prompt: BuiltPrompt = buildPrompt(question, chunks);
        const { answer, inputTokens, outputTokens } = await askClaude(prompt);

        res.status(200).json({
            answer,
            citations: chunks.map(chunk => ({
                content: chunk.content,
                source: chunk.source,
                chunkIndex: chunk.chunkIndex
            })),
            usage: {
                inputTokens,
                outputTokens
            }
        });
    } catch (error) {
        next(error);
    }
}