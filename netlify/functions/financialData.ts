const https = require("https");

exports.handler = async function (event, context) {
  const { ticker } = event.queryStringParameters || {};
  const apiKey = "d1p9r21r01qu436depvgd1p9r21r01qu436deq00"; // Clave API embebida (temporal para pruebas)

  if (!ticker || !apiKey) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing ticker or API key" }),
    };
  }

  const url = `https://finnhub.io/api/v1/quote?symbol=${ticker.toUpperCase()}&token=${apiKey}`;

  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            statusCode: 200,
            body: JSON.stringify({
              ticker: ticker.toUpperCase(),
              stockPrice: parsed.c,
              open: parsed.o,
              high: parsed.h,
              low: parsed.l,
              previousClose: parsed.pc,
            }),
          });
        } catch (error) {
          resolve({
            statusCode: 500,
            body: JSON.stringify({ error: "Invalid response from Finnhub" }),
          });
        }
      });
    }).on("error", (e) => {
      reject({
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to fetch data", details: e.message }),
      });
    });
  });
};