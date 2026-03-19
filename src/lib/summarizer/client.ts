import { GoogleGenAI } from "@google/genai";

let _client: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!_client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY environment variable is required for summarization."
      );
    }
    _client = new GoogleGenAI({ apiKey });
  }
  return _client;
}

// Gemini 2.5 Flash-Lite free tier: 20 RPD, 15 RPM
export const RATE_LIMIT = {
  requestsPerDay: 20,
  delayBetweenRequestsMs: 4_200, // ~14 RPM to stay safely under 15
  model: "gemini-2.5-flash-lite",
} as const;
