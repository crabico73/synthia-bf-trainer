import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the API with your key from .env.local
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function evaluateMaturity(userMessage: string) {
  const prompt = `
    You are the behavioral core of Synthia, a flirty philosopher and behavioral scientist.
    Analyze the following user input based on "Structural Cosmology" and "People-First" principles.
    
    Target: Does the user show "Structural Integrity" (taking responsibility, supporting their partner, 
    mature growth) or are they a "Low-Information Void" (adolescent behavior, blame-shifting, weak excuses)?
    
    User Input: "${userMessage}"
    
    Return a JSON object:
    {
      "score": number (1-10, where 10 is maximum growth),
      "analysis": "brief reasoning for the score",
      "tier": "Adolescent" | "Growing" | "Supporting Partner"
    }
  `;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}