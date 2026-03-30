import type { Request, Response, NextFunction } from "express";
import { retrieveChunks } from "../../query/retriever.js";
import { buildPrompt, type BuiltPrompt } from "../../query/promptBuilder.js";
import { askClaude } from "../../query/llm.js";
import { isValidQuery } from "../../services/intentService.js";

export async function queryController(req: Request, res: Response, next: NextFunction): Promise<void>
{
    try {
        const { question } = req.body;

        if(!question){
            res.status(400).json({ error: 'Pergunta não informada' });
            return;
        }

        const valid = await isValidQuery(question);
        if(!valid){
            res.status(400).json({ error: 'Por favor, envie uma pergunta relacionada aos documentos.' });
            return;
        }

        const chunks = await retrieveChunks(question);
        if(chunks.length === 0){
            res.status(404).json({ error: 'Nenhuma informação relevante encontrada no documento.' });
            return;
        }

        const prompt = buildPrompt(question, chunks);
        const { answer, inputTokens, outputTokens } = await askClaude(prompt);

        res.status(200).json({
            answer,
            usage: {
                inputTokens,
                outputTokens
            }
        });
    } catch (error) {
        next(error);
    }
}