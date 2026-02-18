import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

export const MODEL_ID = "gemini-3-pro-image-preview";

export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});
