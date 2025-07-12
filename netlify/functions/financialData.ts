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

    console.log("Respuesta cruda de Gemini:", text);

    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}") + 1;

    if (jsonStart === -1 || jsonEnd <= jsonStart) {
      throw new Error("No se encontró estructura JSON en la respuesta");
    }

    const jsonString = text.slice(jsonStart, jsonEnd);

    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (err) {
      throw new Error("No se pudo parsear JSON generado por Gemini");
    }

    if (
      !parsed ||
      parsed.stockPrice == null ||
      parsed.wacc == null ||
      parsed.fcfPerShareTTM == null
    ) {
      throw new Error("La respuesta no contiene los campos financieros requeridos");
    }

    return {
      statusCode: 200,
      body: JSON.stringify(parsed),
    };
  } catch (error) {
    console.error("ERROR en financialData.ts:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error al obtener datos desde Gemini", details: error.message }),
    };
  }
};