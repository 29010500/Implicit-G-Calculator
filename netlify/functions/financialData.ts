const https = require("https");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("d1p9r21r01qu436depvgd1p9r21r01qu436deq00");

exports.handler = async function (event, context) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  let query = null;
  try {
    const body = JSON.parse(event.body);
    query = body.query;
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON body" }),
    };
  }

  if (!query) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing company name or ticker" }),
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
Dame los siguientes datos reales y actualizados de la empresa "${query}":
- Precio de la acción actual
- WACC estimado
- Free Cash Flow por acción TTM

Devuélvelo en formato JSON con esta estructura exacta:

{
  "ticker": "...",
  "stockPrice": ...,
  "wacc": ...,
  "fcfPerShareTTM": ...,
  "sources": ["..."]
}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}") + 1;
    const jsonString = text.slice(jsonStart, jsonEnd);

    const parsed = JSON.parse(jsonString);

    return {
      statusCode: 200,
      body: JSON.stringify(parsed),
    };
  } catch (error) {
    console.error("Gemini error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to retrieve data from Gemini", details: error.message }),
    };
  }
};