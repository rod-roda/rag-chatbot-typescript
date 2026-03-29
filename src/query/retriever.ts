import OpenAI from "openai";
import { getCollection } from "../database/chroma.js";

interface RetrievedChunk {
    content: string,
    source: string,
    chunkIndex: number,
    distance: number
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });