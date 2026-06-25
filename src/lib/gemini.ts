import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

export function getAiClient() {
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!geminiApiKey) {
        throw new Error("Missing GEMINI_API_KEY");
    }

    if (!aiClient) {
        aiClient = new GoogleGenAI({
            apiKey: geminiApiKey,
        });
    }

    return aiClient;
}
