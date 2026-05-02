import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function parseExpenses(rawText: string, allowance: number): Promise<AnalysisResult> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze this raw expense 'brain dump' from a hostel student in Pakistan. 
    The text may be in English or Roman Urdu (e.g., 'biryani khayi 300 ki').
    
    Return a structured JSON object.
    Current Date: ${new Date().toLocaleDateString()}
    Allowance: ${allowance}
    
    User Input:
    """
    ${rawText}
    """`,
    config: {
      responseMimeType: "application/json",
      systemInstruction: `You are 'SCNZ Hostel Guru', an expert hostel expense advisor. 
      Your job is to parse messy text into structured financial data.
      1. Extract every individual expense.
      2. Categorize them accurately (Food, Transport, Social, Utilities, Academic, Misc).
      3. Items like 'dost ki party' or 'shadi' go to Social.
      4. Items like 'rickshaw' or 'indriver' go to Transport.
      5. DETECT LOANS: If someone owes money or the user owes money (e.g. 'Ali ko 500 dury', 'Sara se 1000 lie'), extract them into the 'debts' array.
         - 'owes_me': User gave money to someone.
         - 'i_owe': User took money from someone.
      6. Provide 3-4 pieces of 'Vibe Advice' based on their spending patterns relative to their allowance.
      7. Use Roman Urdu/English mix for advice to keep the 'hostel vibe'.
      8. Ensure the advice severity is 'info' (doing well), 'warning' (spending too much), or 'error' (out of control).`,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          expenses: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                amount: { type: Type.NUMBER },
                category: { type: Type.STRING, description: "Food, Transport, Social, Utilities, Academic, Misc" },
                date: { type: Type.STRING }
              },
              required: ["id", "name", "amount", "category", "date"]
            }
          },
          debts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                peerName: { type: Type.STRING },
                amount: { type: Type.NUMBER },
                type: { type: Type.STRING, description: 'owes_me or i_owe' },
                settled: { type: Type.BOOLEAN }
              },
              required: ["id", "peerName", "amount", "type", "settled"]
            }
          },
          summary: {
            type: Type.OBJECT,
            properties: {
              totalBudget: { type: Type.NUMBER },
              totalSpent: { type: Type.NUMBER },
              remaining: { type: Type.NUMBER },
              categories: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING },
                    amount: { type: Type.NUMBER },
                    percentage: { type: Type.NUMBER }
                  },
                  required: ["category", "amount", "percentage"]
                }
              }
            },
            required: ["totalBudget", "totalSpent", "remaining", "categories"]
          },
          advice: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                severity: { type: Type.STRING, description: "info, warning, or error" }
              },
              required: ["title", "description", "severity"]
            }
          }
        },
        required: ["expenses", "summary", "advice"]
      },
    },
  });

  try {
    return JSON.parse(response.text.trim()) as AnalysisResult;
  } catch (e) {
    console.error("Failed to parse Gemini response:", e);
    throw new Error("AI couldn't process the khata. Try again with clearer numbers!");
  }
}
