exports.handler = async function (event, context) {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Función financialData funcionando correctamente 🚀"
    }),
  };
};