import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

const getAI = () => {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set. Gemini features will be disabled.");
      return null;
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
};

export const generateJobDescription = async (title: string, category: string) => {
  try {
    const client = getAI();
    if (!client) return "Complete the task as described in the title and submit proof.";

    const response = await client.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a short, professional micro-job description for a task titled "${title}" in the category "${category}". Include clear steps for the user and what proof is required. Keep it under 150 words.`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini error:", error);
    return "Complete the task as described in the title and submit proof.";
  }
};
