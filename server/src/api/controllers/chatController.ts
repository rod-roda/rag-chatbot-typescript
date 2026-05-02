import type { Request, Response, NextFunction } from "express";
import prisma from "../../database/prisma.js";
import NotFound from "../errors/NotFound.js";
import BadRequest from "../errors/BadRequest.js";

export async function createChat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { title } = req.body;
        if (!title || typeof title !== 'string' || !title.trim()) {
            next(new BadRequest('title is required'));
            return;
        }
        const chat = await prisma.chat.create({
            data: { userId: req.userId, title: title.trim() },
            select: { id: true, title: true, createdAt: true },
        });
        res.status(201).json(chat);
    } catch (error) {
        next(error);
    }
}

export async function listChats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const chats = await prisma.chat.findMany({
            where: { userId: req.userId },
            orderBy: { createdAt: 'desc' },
            select: { id: true, title: true, createdAt: true },
        });
        res.json(chats);
    } catch (error) {
        next(error);
    }
}

export async function deleteChat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const id = req.params.id as string;
        const chat = await prisma.chat.findFirst({
            where: { id, userId: req.userId },
        });
        if (!chat) {
            next(new NotFound('Chat not found'));
            return;
        }
        await prisma.chat.delete({ where: { id } });
        res.status(204).end();
    } catch (error) {
        next(error);
    }
}

export async function getChatMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const id = req.params.id as string;
        const chat = await prisma.chat.findFirst({
            where: { id, userId: req.userId },
        });
        if (!chat) {
            next(new NotFound('Chat not found'));
            return;
        }
        const messages = await prisma.message.findMany({
            where: { chatId: id },
            orderBy: { createdAt: 'asc' },
            select: { id: true, role: true, content: true, citations: true, createdAt: true },
        });
        res.json(messages.map(m => ({
            ...m,
            citations: m.citations ? JSON.parse(m.citations) : undefined,
        })));
    } catch (error) {
        next(error);
    }
}

export async function saveMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const id = req.params.id as string;
        const chat = await prisma.chat.findFirst({
            where: { id, userId: req.userId },
        });
        if (!chat) {
            next(new NotFound('Chat not found'));
            return;
        }
        const { messages } = req.body;
        if (!Array.isArray(messages) || messages.length === 0) {
            next(new BadRequest('messages array is required'));
            return;
        }
        await prisma.message.createMany({
            data: messages.map((m: { role: string; content: string; citations?: unknown }) => ({
                chatId: id,
                role: m.role,
                content: m.content,
                citations: m.citations ? JSON.stringify(m.citations) : null,
            })),
        });
        res.status(201).end();
    } catch (error) {
        next(error);
    }
}
