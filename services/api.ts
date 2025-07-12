import { FinancialData, GroundingSource } from "../types";

export async function fetchFinancialData(
  query: string
): Promise<{ data: FinancialData | null; sources: GroundingSource[] }> {
  try {
    const response = await fetch("/.netlify/functions/financialData", {
      method: "POST",
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error("HTTP error! status: " + response.status);
    }

    const json = await response.json();

    if (json && typeof json.stockPrice === "number") {
      const { stockPrice, open, high, low, previousClose, sources } = json;

      return {
        data: {
          stockPrice,
          open,
          high,
          low,
          previousClose,
        },
        sources: sources || [],
      };
    }

    return { data: null, sources: [] };
  } catch (error) {
    console.error("fetchFinancialData error:", error);
    return { data: null, sources: [] };
  }
}