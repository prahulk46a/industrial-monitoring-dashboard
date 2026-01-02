const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const env = require("./config/environment");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");
const dataPublisher = require("./scheduler/dataPublisher");

// Import routes
const digitalInputRoutes = require("./routes/digitalInputRoutes");
const digitalOutputRoutes = require("./routes/digitalOutputRoutes");
const analogInputRoutes = require("./routes/analogInputRoutes");
const analogOutputRoutes = require("./routes/analogOutputRoutes");
const alarmRoutes = require("./routes/alarmRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/api/digital-inputs", digitalInputRoutes);
app.use("/api/digital-outputs", digitalOutputRoutes);
app.use("/api/analog-inputs", analogInputRoutes);
app.use("/api/analog-outputs", analogOutputRoutes);
app.use("/api/alarms", alarmRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);
app.use(notFoundHandler);

module.exports = { app, dataPublisher };
