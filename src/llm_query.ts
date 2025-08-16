// gemini.ts

import axios from "axios";
import * as dotenv from "dotenv";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("❌ Missing GEMINI_API_KEY in .env file");
}

const GEMINI_API_URL = process.env.GEMINI_API_KEY;

if (!GEMINI_API_URL) {
  throw new Error("❌ Missing GEMINI_API_URL in .env file");
}

export async function queryGemini(prompt: string): Promise<string> {
  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    return text || "❌ No response from Gemini";
  } catch (err: any) {
    console.error("Gemini API error:", err.response?.data || err.message);
    throw new Error("Failed to query Gemini");
  }
}
