
import { GoogleGenAI } from "@google/genai";
import type { Handler } from "@netlify/functions";
import type { FinancialData, GroundingSource, GeminiApiResponse } from "../../types";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = "gemini-2.5-flash";

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  try {
    const { query } = JSON.parse(event.body || '{}');

    if (!query) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Stock ticker or company name is required' }),
        headers: { 'Content-Type': 'application/json' },
      };
    }

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
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
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
        throw new Error(`Could not retrieve the following required values: ${missingKeys.join(', ')}.`);
    }

    const validatedData = data as FinancialData;
    const apiResponse: GeminiApiResponse = { data: validatedData, sources };

    return {
      statusCode: 200,
      body: JSON.stringify(apiResponse),
      headers: { 'Content-Type': 'application/json' },
    };

  } catch (error) {
    console.error("Function error:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return {
      statusCode: 500,
      body: JSON.stringify({ error: message }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};

export { handler };
