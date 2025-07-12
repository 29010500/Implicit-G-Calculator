import { GoogleGenAI } from "@google/genai";
import { FinancialData, GroundingSource, GeminiApiResponse } from '../types';

// The API key is expected to be available as an environment variable.
if (!process.env.API_KEY) {
    // This check is a safeguard. In a production environment (like Netlify/Vercel),
    // this environment variable must be set in the build/deploy settings.
    throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = "gemini-2.5-flash";

/**
 * Fetches financial data for a given stock ticker or company name using the Gemini API.
 * @param query The stock ticker symbol or company name.
 * @returns A promise that resolves to the financial data and its sources.
 */
export const fetchFinancialData = async (query: string): Promise<GeminiApiResponse> => {
    const prompt = `
      For the company or stock ticker "${query}", find the most recent financial data available from public sources. 
      I need the following four metrics:
      1.  Current stock price in its native trading currency.
      2.  Free Cash Flow (FCF) per share TTM (Trailing Twelve Months) in the same native currency.
      3.  Weighted Average Cost of Capital (WACC) as a percentage (e.g., 8.5 for 8.5%).
      4.  The ISO 4217 currency code for the stock price and FCF (e.g., "USD", "EUR", "JPY").

      Please provide your response as a single, clean JSON object with no extra text, formatting, or markdown.
      The JSON object should have the keys: "stockPrice", "fcfPerShare", "wacc", and "currency".
      The values for the first three keys should be numbers only. The currency should be a string. If you cannot find a specific value, return null for that key. For example:
      {
        "stockPrice": 150.75,
        "fcfPerShare": 5.20,
        "wacc": 8.5,
        "currency": "USD"
      }
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
        const sources: GroundingSource[] = groundingMetadata?.groundingChunks
          ?.map((chunk: any) => ({
            uri: chunk.web?.uri || '',
            title: chunk.web?.title || 'Untitled Source',
          }))
          .filter((source: GroundingSource) => source.uri) || [];

        const responseText = response.text;
        if (!responseText) {
            throw new Error("Received an empty response from the API.");
        }

        // Extract the JSON part from the response, as Gemini might add markdown backticks
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            // If no JSON object is found, it's likely the model returned a conversational text response instead.
            // This text is more informative as an error message.
            throw new Error(`API response did not contain valid data. Response: "${responseText.trim()}"`);
        }

        const jsonString = jsonMatch[0];
        const data: Partial<FinancialData> = JSON.parse(jsonString);
        
        const requiredKeys: (keyof FinancialData)[] = ['stockPrice', 'fcfPerShare', 'wacc', 'currency'];
        const missingKeys = requiredKeys.filter(key => {
            const value = data[key];
            return value === undefined || value === null;
        });

        if (missingKeys.length > 0) {
            throw new Error(`Could not retrieve the following required values from the API: ${missingKeys.join(', ')}.`);
        }
        
        if (typeof data.currency !== 'string' || data.currency.length === 0) {
             throw new Error(`Invalid currency format received from API.`);
        }

        // Type assertion is safe now after validation.
        const validatedData = data as FinancialData;
        
        return { data: validatedData, sources };
    } catch (error) {
        console.error("Gemini API Error:", error);
        if (error instanceof Error) {
            // Re-throw the specific error message from our logic or the underlying API error
            throw error;
        }
        throw new Error("An unexpected error occurred while calling the Gemini API.");
    }
};