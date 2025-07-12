
import { GeminiApiResponse } from '../types';

/**
 * Fetches financial data by calling our secure Netlify serverless function.
 * @param query The stock ticker symbol or company name.
 * @returns A promise that resolves to the financial data and its sources.
 */
export const fetchFinancialData = async (query: string): Promise<GeminiApiResponse> => {
  const response = await fetch('/.netlify/functions/financialData', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
    throw new Error(errorBody.error || `Request failed with status ${response.status}`);
  }

  return response.json();
};
