const { apiResponse } = require("./responseHandler");

const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  apiResponse(res, statusCode, message);
};

const notFoundHandler = (req, res) => {
  apiResponse(res, 404, "Endpoint not found");
};

module.exports = { errorHandler, notFoundHandler };
