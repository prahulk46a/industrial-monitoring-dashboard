// npm install express mysql2 dotenv cors body-parser

const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());



// ==================== HELPER code ====================
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "root",
  database: "industrialmonitoring",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};
const pool = mysql.createPool(dbConfig);
function apiResponse(res, statusCode, message, data = null) {
  res.status(statusCode).json({
    success: statusCode >= 200 && statusCode < 300,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
}
function handleError(res, error, statusCode = 500) {
  console.error("API Error:", error);
  apiResponse(res, statusCode, error.message || "Internal Server Error");
}



// ==================== APIS ====================

// GET digital input readings (latest)
app.get("/api/digital-inputs/readings", async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    const connection = await pool.getConnection();
   

    let query = `
      SELECT dir.*, dit.description 
      FROM digital_input_readings dir
      JOIN digital_input_tags dit ON dir.tag_id = dit.tag_id
    `;

    const params = [];

    query += ` ORDER BY dir.id DESC LIMIT ${limit}`;
    params.push(parseInt(limit));

    const [rows] = await connection.execute(query, params);
    connection.release();

    apiResponse(res, 200, "Digital input readings retrieved", rows.reverse());
  } catch (error) {
    handleError(res, error);
  }
});

// GET digital output readings
app.get("/api/digital-outputs/readings", async (req, res) => {
  let connection;
  try {
    const { tagId } = req.query;
    const limit = Number(req.query.limit) || 4;

    connection = await pool.getConnection();

    let query = `
      SELECT dor.*, dot.description
      FROM digital_output_readings dor
      JOIN digital_output_tags dot
        ON dor.tag_id = dot.tag_id
    `;

    const params = [];

    if (tagId) {
      query += ` WHERE dor.tag_id = ?`;
      params.push(tagId);
    }

    query += ` ORDER BY dor.id DESC LIMIT ${limit}`;

    const [rows] = await connection.query(query, params);

    apiResponse(
      res,
      200,
      "Digital output readings retrieved",
      rows.reverse()
    );
  } catch (error) {
    handleError(res, error);
  } finally {
    if (connection) connection.release();
  }
});

app.get("/api/analog-outputs/readings", async (req, res) => {
  let connection;
  try {
    const { tagId, tag_id, status } = req.query;
    const limit = Number(req.query.limit) || 1;
    const filterTagId = tagId || tag_id;

    connection = await pool.getConnection();

    let query = `
      SELECT aor.*, aot.description, aot.unit
      FROM analog_output_readings aor
      JOIN analog_output_tags aot
        ON aor.tag_id = aot.tag_id
    `;

    const params = [];
    const conditions = [];

    if (filterTagId) {
      conditions.push(`aor.tag_id = ?`);
      params.push(filterTagId);
    }

    if (status) {
      conditions.push(`aor.status = ?`);
      params.push(status);
    }

    if (conditions.length) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += ` ORDER BY aor.id DESC LIMIT ${limit}`;

    const [rows] = await connection.query(query, params);

    apiResponse(res, 200, "Analog output readings retrieved", rows.reverse());
  } catch (error) {
    handleError(res, error);
  } finally {
    if (connection) connection.release();
  }
});

//======================================================= APIS for Analog INPUT Tags ==============================================

// GET analog input readings
app.get("/api/analog-inputs/readings", async (req, res) => {
  let connection;
  try {
    const { tagId, tag_id, status } = req.query;
    const limit = Number(req.query.limit) || 10;

    // support both param names
    const filterTagId = tagId || tag_id;

    connection = await pool.getConnection();

    let query = `
      SELECT air.*, ait.description, ait.unit
      FROM analog_input_readings air
      JOIN analog_input_tags ait
        ON air.tag_id = ait.tag_id
    `;

    const params = [];
    const conditions = [];

    if (filterTagId) {
      conditions.push(`air.tag_id = ?`);
      params.push(filterTagId);
    }

    if (status) {
      conditions.push(`air.status = ?`);
      params.push(status);
    }

    if (conditions.length) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    // ✅ inline LIMIT (NO placeholder)
    query += ` ORDER BY air.id DESC LIMIT ${limit}`;

    const [rows] = await connection.query(query, params);

    apiResponse(
      res,
      200,
      "Analog input readings retrieved",
      rows.reverse()
    );
  } catch (error) {
    handleError(res, error);
  } finally {
    if (connection) connection.release();
  }
});

// ==================== ALARM APIS ====================

// GET all alarms with filters
app.get("/api/alarms", async (req, res) => {
  try {
    const { status = "ACTIVE", priority, limit = 10, offset = 0 } = req.query;
    const connection = await pool.getConnection();

    let query = `
      SELECT *
      FROM alarms
      WHERE 1=1
    `;

    if (status) {
      query += ` AND status = '${status}'`;
    }

    if (priority) {
      query += ` AND priority = '${priority}'`;
    }

    query += ` ORDER BY triggered_at DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

    const [rows] = await connection.execute(query);
    connection.release();

    apiResponse(res, 200, "Alarms retrieved", {
      limit: Number(limit),
      offset: Number(offset),
      alarms: rows
    });
  } catch (error) {
    handleError(res, error);
  }
});


// GET specific alarm
app.get("/api/alarms/:alarmId", async (req, res) => {
  try {
    const { alarmId } = req.params;
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      "SELECT * FROM alarms WHERE id = ?",
      [alarmId]
    );
    connection.release();

    if (rows.length === 0) {
      return apiResponse(res, 404, "Alarm not found");
    }

    apiResponse(res, 200, "Alarm retrieved", rows[0]);
  } catch (error) {
    handleError(res, error);
  }
});

// ACKNOWLEDGE alarm
app.post("/api/alarms/:alarmId/acknowledge", async (req, res) => {
  try {
    const { alarmId } = req.params;
    const connection = await pool.getConnection();

    await connection.execute(
      "UPDATE alarms SET acknowledged_at = NOW() WHERE id = ?",
      [alarmId]
    );

    connection.release();

    apiResponse(res, 200, "Alarm acknowledged successfully");
  } catch (error) {
    handleError(res, error);
  }
});

// RESOLVE alarm
app.post("/api/alarms/:alarmId/resolve", async (req, res) => {
  try {
    const { alarmId } = req.params;
    const connection = await pool.getConnection();

    await connection.execute(
      "UPDATE alarms SET status = 'RESOLVED', resolved_at = NOW() WHERE id = ?",
      [alarmId]
    );

    connection.release();

    apiResponse(res, 200, "Alarm resolved successfully");
  } catch (error) {
    handleError(res, error);
  }
});

// GET alarm statistics
app.get("/api/alarms/stats/summary", async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const [stats] = await connection.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'RESOLVED' THEN 1 ELSE 0 END) as resolved,
        SUM(CASE WHEN priority = 'CRITICAL' THEN 1 ELSE 0 END) as critical,
        SUM(CASE WHEN priority = 'MODERATE' THEN 1 ELSE 0 END) as moderate,
        SUM(CASE WHEN priority = 'HEALTHY' THEN 1 ELSE 0 END) as healthy
      FROM alarms
    `);

    connection.release();

    apiResponse(res, 200, "Alarm statistics retrieved", stats[0]);
  } catch (error) {
    handleError(res, error);
  }
});

// ==================== DASHBOARD APIS ====================

// GET complete dashboard summary
app.get("/api/dashboard/summary", async (req, res) => {
  try {
    const connection = await pool.getConnection();

    


    // Get statistics
    const [stats] = await connection.execute(`
      SELECT 
        (SELECT COUNT(*) FROM digital_input_readings WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 1 MINUTE)) as di_readings,
        (SELECT COUNT(*) FROM digital_output_readings WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 1 MINUTE)) as do_readings,
        (SELECT COUNT(*) FROM analog_input_readings WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 1 MINUTE)) as ai_readings,
        (SELECT COUNT(*) FROM analog_output_readings WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 1 MINUTE)) as ao_readings,
        (SELECT COUNT(*) FROM alarms WHERE status = 'ACTIVE') as active_alarms,
        (SELECT COUNT(*) FROM alarms) as total_alarms
    `);

    connection.release();

    apiResponse(res, 200, "Dashboard summary retrieved", {
      statistics: stats[0],

    });
  } catch (error) {
    handleError(res, error);
  }
});

// GET readings in time range
app.get("/api/readings/time-range", async (req, res) => {
  try {
    const { tagId, startTime, endTime } = req.query;

    if (!tagId || !startTime || !endTime) {
      return apiResponse(
        res,
        400,
        "Missing required parameters: tagId, startTime, endTime"
      );
    }

    const connection = await pool.getConnection();

    const [readings] = await connection.execute(
      `SELECT * FROM analog_input_readings 
       WHERE tag_id = ? AND timestamp BETWEEN ? AND ?
       ORDER BY timestamp ASC`,
      [tagId, startTime, endTime]
    );

    connection.release();

    apiResponse(res, 200, "Time range readings retrieved", readings);
  } catch (error) {
    handleError(res, error);
  }
});

// ==================== HEALTH CHECK ====================

app.get("/api/health", (req, res) => {
  apiResponse(res, 200, "API is running");
});

// ==================== ERROR HANDLER ====================

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  apiResponse(res, 500, "Internal Server Error");
});

// 404 handler
app.use((req, res) => {
  apiResponse(res, 404, "Endpoint not found");
});

// ==================== DATA GENERATOR ====================

// Reference to alarm tracker (same as your original code)
class AlarmTracker {
  constructor() {
    this.activeAlarms = new Map();
    this.alarmHistory = [];
    this.totalAlarms = 0;
    this.totalResolved = 0;
  }

  checkAlarms(analogInputs, timestamp) {
    const newAlarms = [];
    for (const input of analogInputs) {
      const tagId = input.tagId;
      const value = input.value;
      const currentLevel = getAlarmLevel(tagId, value);
      const existingAlarm = this.activeAlarms.get(tagId);

      if (currentLevel !== "HEALTHY") {
        if (!existingAlarm || existingAlarm.level !== currentLevel) {
          const alarm = createAlarmObject(tagId, value, currentLevel, timestamp);
          this.activeAlarms.set(tagId, alarm);
          this.totalAlarms++;
          newAlarms.push(alarm);
        } else {
          existingAlarm.currentValue = value;
          existingAlarm.timestamp = timestamp.toISOString();
        }
      } else {
        if (existingAlarm) {
          existingAlarm.status = "RESOLVED";
          this.alarmHistory.push(existingAlarm);
          this.activeAlarms.delete(tagId);
          this.totalResolved++;
        }
      }
    }
    return newAlarms;
  }

  getActiveAlarms() {
    return Array.from(this.activeAlarms.values());
  }

  getAlarmStatistics() {
    const activeAlarms = this.getActiveAlarms();
    return {
      totalAlarms: this.totalAlarms,
      totalResolved: this.totalResolved,
      activeAlarmCount: activeAlarms.length,
      criticalCount: activeAlarms.filter((a) => a.level === "CRITICAL").length,
      warningCount: activeAlarms.filter((a) => a.level === "MODERATE").length,
    };
  }
}

// Alarm thresholds
const ALARM_THRESHOLDS = {
  "AI-001": { moderate: 5, critical: 8, unit: "bar" },
  "AI-002": { moderate: 50, critical: 75, unit: "°C" },
  "AI-003": { moderate: 50, critical: 75, unit: "°C" },
  "AI-004": { moderate: 30, critical: 50, unit: "%" },
  "AI-005": { moderate: 25, critical: 40, unit: "kg" },
  "AI-006": { moderate: 7, critical: 9, unit: "pH" },
  "AI-007": { moderate: 750, critical: 1200, unit: "RPM" },
};

const ALARM_LEVELS = {
  CRITICAL: { priority: 1, color: "RED" },
  MODERATE: { priority: 2, color: "YELLOW" },
  HEALTHY: { priority: 3, color: "GREEN" },
};

const DIGITAL_INPUT_TAGS = [
  { id: 1, tagId: "DI-001", description: "VOLTAGE PROTECTION RELAY" },
  { id: 2, tagId: "DI-002", description: "EMERGENCY STOP" },
  { id: 3, tagId: "DI-003", description: "BUZZER RESET PB" },
  { id: 4, tagId: "DI-004", description: "MIXER VFD TRIP" },
  { id: 5, tagId: "DI-005", description: "MIXER VFD RUN" },
  { id: 6, tagId: "DI-006", description: "MIXER VFD HEALTHY" },
  { id: 7, tagId: "DI-007", description: "CIRCULATION PUMP TRIP" },
  { id: 8, tagId: "DI-008", description: "CIRCULATION PUMP RUN" },
];

const DIGITAL_OUTPUT_TAGS = [
  { id: 1, tagId: "DO-001", description: "BUZZER " },
  { id: 2, tagId: "DO-002", description: "EMERGENCY" },
  { id: 3, tagId: "DO-003", description: "CIP VALVE-1 " },
  { id: 4, tagId: "DO-004", description: "SIP VALVE-1 " },
];

const ANALOG_INPUT_TAGS = [
  { tagId: "AI-001", description: "LINE 1 - PRESSURE", unit: "bar", baseValue: 5, volatility: 1.5, minValue: 0, maxValue: 10 },
  { tagId: "AI-002", description: "LINE 1 - TEMPERATURE", unit: "°C", baseValue: 50, volatility: 8, minValue: 0, maxValue: 100 },
  { tagId: "AI-003", description: "LINE 2 - TEMPERATURE", unit: "°C", baseValue: 48, volatility: 7, minValue: 0, maxValue: 100 },
  { tagId: "AI-004", description: "DO TRANSMITTER", unit: "%", baseValue: 45, volatility: 12, minValue: 0, maxValue: 100 },
  { tagId: "AI-005", description: "LOAD CELL", unit: "kg", baseValue: 25, volatility: 3, minValue: 0, maxValue: 50 },
  { tagId: "AI-006", description: "COND PH SENSOR", unit: "pH", baseValue: 7, volatility: 0.8, minValue: 0, maxValue: 14 },
  { tagId: "AI-007", description: "MAGNETIC MIXER", unit: "RPM", baseValue: 1100, volatility: 80, minValue: 0, maxValue: 1500 },
];

const ANALOG_OUTPUT_TAGS = [
  { tagId: "AO-001", description: "CONTROL VALVE", unit: "%", baseValue: 50, volatility: 15, minValue: 0, maxValue: 100 },
];

// Helper functions
function generateRandomBoolean() {
  return Math.random() > 0.5;
}

function generateRandomValue(baseValue, volatility, minValue, maxValue) {
  const variation = (Math.random() - 0.5) * 2 * volatility;
  const newValue = baseValue + variation;
  return parseFloat(Math.max(minValue, Math.min(maxValue, newValue)).toFixed(2));
}

function getAlarmLevel(tagId, value) {
  const threshold = ALARM_THRESHOLDS[tagId];
  if (!threshold) return "HEALTHY";
  if (value >= threshold.critical) return "CRITICAL";
  if (value >= threshold.moderate) return "MODERATE";
  return "HEALTHY";
}

function generateAlarmId() {
  return `ALM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function createAlarmObject(tagId, value, alarmLevel, timestamp) {
  const threshold = ALARM_THRESHOLDS[tagId];
  const levelConfig = ALARM_LEVELS[alarmLevel];
  
  // Find tag description from ANALOG_INPUT_TAGS
  const tagInfo = ANALOG_INPUT_TAGS.find(t => t.tagId === tagId);
  const tagDescription = tagInfo ? tagInfo.description : tagId;

  return {
    id: generateAlarmId(),
    tag_id: tagId,
    tag_type: "ANALOG_INPUT",
    priority: alarmLevel, // CRITICAL, MODERATE, HEALTHY
    description: `${tagDescription} - Value: ${value} ${threshold.unit}${
      alarmLevel === "CRITICAL"
        ? `. Critical threshold: ${threshold.critical}`
        : alarmLevel === "MODERATE"
        ? `. Moderate threshold: ${threshold.moderate}`
        : ""
    }. Requires attention.`,
    triggered_value: `${value} ${threshold.unit}`,
    triggered_at: timestamp.toISOString(),
    acknowledged_at: null,
    resolved_at: null,
    status: "ACTIVE",
  };
}

// Global alarm tracker
const alarmTracker = new AlarmTracker();
let dataStreamCounter = 0;

// Data publishing function
async function publishSampleData() {
  try {
    const connection = await pool.getConnection();
    const timestamp = new Date();
    dataStreamCounter++;

    // Generate Digital Inputs
    const digitalInputs = [];
    for (const tag of DIGITAL_INPUT_TAGS) {
      const value = generateRandomBoolean();
      await connection.execute(
        "INSERT INTO digital_input_readings (tag_id, value, timestamp) VALUES (?, ?, ?)",
        [tag.tagId, value ? 1 : 0, timestamp]
      );
      digitalInputs.push({
        tagId: tag.tagId,
        description: tag.description,
        value: value,
      });
    }

    // Generate Digital Outputs
    const digitalOutputs = [];
    for (const tag of DIGITAL_OUTPUT_TAGS) {
      const value = generateRandomBoolean();
      await connection.execute(
        "INSERT INTO digital_output_readings (tag_id, value, timestamp) VALUES (?, ?, ?)",
        [tag.tagId, value ? 1 : 0, timestamp]
      );
      digitalOutputs.push({
        tagId: tag.tagId,
        description: tag.description,
        value: value,
      });
    }

    // Generate Analog Inputs
    const analogInputs = [];
    for (const tag of ANALOG_INPUT_TAGS) {
      const value = generateRandomValue(tag.baseValue, tag.volatility, tag.minValue, tag.maxValue);
      const status = value > (tag.maxValue - tag.minValue) * 0.6 ? "MODERATE" : "HEALTHY";

      await connection.execute(
        "INSERT INTO analog_input_readings (tag_id, value, status, timestamp) VALUES (?, ?, ?, ?)",
        [tag.tagId, value, status, timestamp]
      );

      analogInputs.push({
        tagId: tag.tagId,
        description: tag.description,
        value: value,
        unit: tag.unit,
        status: status,
      });
    }

    // Generate Analog Outputs
    const analogOutputs = [];
    for (const tag of ANALOG_OUTPUT_TAGS) {
      const value = generateRandomValue(tag.baseValue, tag.volatility, tag.minValue, tag.maxValue);
      await connection.execute(
        "INSERT INTO analog_output_readings (tag_id, value, timestamp) VALUES (?, ?, ?)",
        [tag.tagId, value, timestamp]
      );
      analogOutputs.push({
        tagId: tag.tagId,
        description: tag.description,
        value: value,
        unit: tag.unit,
      });
    }

    // Check for alarms
    const newAlarms = alarmTracker.checkAlarms(analogInputs, timestamp);

    // Store new alarms
    for (const alarm of newAlarms) {
      try {
        // Check if table structure exists, if not create simplified version
        await connection.execute(
          `INSERT INTO alarms (id, tag_id, tag_type, priority, description, triggered_value, triggered_at, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            alarm.id,
            alarm.tag_id,
            alarm.tag_type,
            alarm.priority,
            alarm.description,
            alarm.triggered_value,
            timestamp,
            alarm.status,
            timestamp
          ]
        );
      } catch (dbError) {
        console.log(`⚠️ Alarm insert note: ${dbError.message}`);
      }
      console.log(`🚨 ALARM: ${alarm.description}`);
    }

    connection.release();

    const stats = alarmTracker.getAlarmStatistics();
    console.log(`\n📊 Data Stream #${dataStreamCounter} published at ${timestamp.toLocaleTimeString()}`);
    console.log(`   Digital Inputs: ${digitalInputs.length} | Digital Outputs: ${digitalOutputs.length}`);
    console.log(`   Analog Inputs: ${analogInputs.length} | Analog Outputs: ${analogOutputs.length}`);
    console.log(`   Active Alarms: ${stats.activeAlarmCount} (Critical: ${stats.criticalCount}, Warning: ${stats.warningCount})\n`);
  } catch (error) {
    console.error("❌ Error publishing data:", error);
  }
}

// ==================== DATABASE INITIALIZATION ====================

async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    console.log("📊 Initializing database...\n");

    // Insert Digital Input Tags
    for (const tag of DIGITAL_INPUT_TAGS) {
      await connection.execute(
        `INSERT INTO digital_input_tags (id, tag_id, description) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE description=VALUES(description)`,
        [tag.id, tag.tagId, tag.description]
      );
    }
    console.log(`✅ ${DIGITAL_INPUT_TAGS.length} Digital Input tags initialized`);

    // Insert Digital Output Tags
    for (const tag of DIGITAL_OUTPUT_TAGS) {
      await connection.execute(
        `INSERT INTO digital_output_tags (id, tag_id, description) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE description=VALUES(description)`,
        [tag.id, tag.tagId, tag.description]
      );
    }
    console.log(`✅ ${DIGITAL_OUTPUT_TAGS.length} Digital Output tags initialized`);

    // Insert Analog Input Tags
    for (const tag of ANALOG_INPUT_TAGS) {
      await connection.execute(
        `INSERT INTO analog_input_tags (id, tag_id, description, unit, min_value, max_value, base_value, volatility) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?) 
         ON DUPLICATE KEY UPDATE description=VALUES(description)`,
        [
          ANALOG_INPUT_TAGS.indexOf(tag) + 1,
          tag.tagId,
          tag.description,
          tag.unit,
          tag.minValue,
          tag.maxValue,
          tag.baseValue,
          tag.volatility
        ]
      );
    }
    console.log(`✅ ${ANALOG_INPUT_TAGS.length} Analog Input tags initialized`);

    // Insert Analog Output Tags
    for (const tag of ANALOG_OUTPUT_TAGS) {
      await connection.execute(
        `INSERT INTO analog_output_tags (id, tag_id, description, unit, min_value, max_value, base_value, volatility) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?) 
         ON DUPLICATE KEY UPDATE description=VALUES(description)`,
        [
          ANALOG_OUTPUT_TAGS.indexOf(tag) + 1,
          tag.tagId,
          tag.description,
          tag.unit,
          tag.minValue,
          tag.maxValue,
          tag.baseValue,
          tag.volatility
        ]
      );
    }
    console.log(`✅ ${ANALOG_OUTPUT_TAGS.length} Analog Output tags initialized\n`);

    connection.release();
  } catch (error) {
    console.error("❌ Database initialization error:", error.message);
  }
}

// Start publishing data every 30 seconds
setInterval(publishSampleData, 30000);
// ==================== SERVER START ====================
app.listen(PORT, async () => {
  // Initialize database first
  await initializeDatabase();
  
  // Publish initial data immediately
  publishSampleData();

  console.log("GET /api/digital-inputs/readings?tagId=DI-001&limit=100");

  console.log("GET /api/digital-outputs/readings?tagId=DO-001&limit=100");

  console.log("GET /api/analog-inputs/readings?status=HEALTHY&limit=100");

  console.log("GET /api/analog-outputs/readings");

  console.log("\n--- Alarms ---");
  console.log("GET /api/alarms/active");
  console.log("GET /api/alarms?status=ACTIVE&limit=100&offset=0");
  console.log("GET /api/alarms/:alarmId");
  console.log("POST /api/alarms/:alarmId/acknowledge");
  console.log("POST /api/alarms/:alarmId/resolve");
  console.log("GET /api/alarms/stats/summary");

  console.log("\n--- Dashboard ---");
  console.log("GET /api/dashboard/summary");
  console.log("GET /api/readings/time-range?tagId=AI-001&startTime=2024-01-01&endTime=2024-01-02");

  console.log("GET /api/health\n");
});