import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY!,
});

export async function getEmbedding(text: string): Promise<number[]> {
  try {
    const response = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: [{ parts: [{ text }] }],
      config: { outputDimensionality: 1536 },
    });
    return response.embeddings[0].values;
  } catch (err: any) {
    console.error("Error generating embedding:", err.response?.data || err.message);
    throw err;
  }
}
