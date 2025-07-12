import React, { useEffect, useState } from "react";

function App() {
  const [price, setPrice] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/.netlify/functions/financialData?ticker=AAPL")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Network response was not ok");
        }
        return res.json();
      })
      .then((data) => {
        console.log("Datos recibidos:", data);
        if (data && data.stockPrice) {
          setPrice(data.stockPrice);
        } else {
          setError("Respuesta sin stockPrice");
        }
      })
      .catch((err) => {
        console.error("Error al obtener datos:", err);
        setError("Error al obtener datos financieros.");
      });
  }, []);

  return (
    <div style={{ fontFamily: "Arial", textAlign: "center", marginTop: "2rem" }}>
      <h1>Precio actual de AAPL</h1>
      {price !== null ? (
        <p style={{ fontSize: "2rem" }}>${price.toFixed(2)}</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : (
        <p>Cargando...</p>
      )}
    </div>
  );
}

export default App;