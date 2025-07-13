import React, { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

// TU API KEY AQUÍ
const genAI = new GoogleGenerativeAI("d1p9r21r01qu436depvgd1p9r21r01qu436deq00");

function App() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchFinancialData = async () => {
    setLoading(true);
    setError("");
    setResult(null);

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

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}") + 1;
      const jsonString = text.slice(jsonStart, jsonEnd);

      const data = JSON.parse(jsonString);
      setResult(data);
    } catch (err) {
      console.error("Error al obtener datos:", err);
      setError("No se pudo obtener datos reales. Intenta con otro nombre o ticker.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: "Arial", padding: "2rem" }}>
      <h1>Consulta Financiera con Gemini</h1>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Nombre o ticker de empresa"
        style={{ padding: "0.5rem", fontSize: "1rem", width: "300px" }}
      />
      <button onClick={fetchFinancialData} style={{ marginLeft: "1rem", padding: "0.5rem 1rem" }}>
        Consultar
      </button>

      {loading && <p>Cargando datos reales desde Gemini...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {result && (
        <div style={{ marginTop: "2rem" }}>
          <h2>{result.ticker}</h2>
          <p><strong>Precio:</strong> ${result.stockPrice}</p>
          <p><strong>WACC:</strong> {(result.wacc * 100).toFixed(2)}%</p>
          <p><strong>FCF por acción (TTM):</strong> ${result.fcfPerShareTTM}</p>
          <p><strong>Fuentes:</strong> {result.sources?.join(", ")}</p>
        </div>
      )}
    </div>
  );
}

export default App;