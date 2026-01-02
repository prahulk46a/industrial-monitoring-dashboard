const { app, dataPublisher } = require("./src/app");
const env = require("./src/config/environment");

const PORT = env.PORT;

app.listen(PORT, async () => {
  try {
    // Initialize database
    await dataPublisher.initializeDatabase();

    // Publish initial data immediately
    await dataPublisher.publishSampleData();

    // Start scheduler for periodic data publishing (every 30 seconds)
    dataPublisher.startScheduler(30000);

    console.log(`\n✅ Server running on port ${PORT}`);
    console.log(`📊 Data publishing started (interval: 30s)\n`);

    // Log available endpoints
    console.log("Available Endpoints:");
    console.log("\n--- Digital Inputs ---");
    console.log("GET /api/digital-inputs/readings?limit=8");
    console.log("GET /api/digital-inputs/tags");

    console.log("\n--- Digital Outputs ---");
    console.log("GET /api/digital-outputs/readings?tagId=DO-001&limit=4");
    console.log("GET /api/digital-outputs/tags");

    console.log("\n--- Analog Inputs ---");
    console.log("GET /api/analog-inputs/readings?status=HEALTHY&limit=10");
    console.log("GET /api/analog-inputs/tags");

    console.log("\n--- Analog Outputs ---");
    console.log("GET /api/analog-outputs/readings?limit=1");
    console.log("GET /api/analog-outputs/tags");

    console.log("\n--- Alarms ---");
    console.log("GET /api/alarms?status=ACTIVE&limit=10&offset=0");
    console.log("GET /api/alarms/:alarmId");
    console.log("GET /api/alarms/by-tag/:tagId?days=30&limit=50");
    console.log("GET /api/alarms/stats/summary?days=30");
    console.log("POST /api/alarms/:alarmId/acknowledge");
    console.log("POST /api/alarms/:alarmId/resolve");

    console.log("\n--- Health ---");
    console.log("GET /api/health\n");
  } catch (error) {
    console.error("❌ Server startup error:", error);
    process.exit(1);
  }
});

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n\n👋 Shutting down gracefully...");
  process.exit(0);
});
