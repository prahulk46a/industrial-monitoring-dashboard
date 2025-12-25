// npm install mysql2 dotenv

const mysql = require("mysql2/promise");
require("dotenv").config();

// Database Configuration
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "7887466968",
  database: "industrial_monitoring",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

const pool = mysql.createPool(dbConfig);

// DIGITAL INPUT TAGS
const DIGITAL_INPUT_TAGS = [
  {
    id: 1,
    tagId: "DI-001",
    description: "VOLTAGE PROTECTION RELAY HEALTHY",
    tag: "HI-01",
    displayFormat: "GREEN COLOUR",
    type: "DIGITAL_INPUT",
    dataType: "Boolean",
  },
  {
    id: 2,
    tagId: "DI-002",
    description: "EMERGENCY STOP (HEALTHY)",
    tag: "HI-01",
    displayFormat: "GREEN COLOUR",
    type: "DIGITAL_INPUT",
    dataType: "Boolean",
  },
  {
    id: 3,
    tagId: "DI-003",
    description: "BUZZER RESET PB",
    tag: "HI-2",
    displayFormat: "GREEN COLOUR",
    type: "DIGITAL_INPUT",
    dataType: "Boolean",
  },
  {
    id: 4,
    tagId: "DI-004",
    description: "MIXER VFD TRIP F/B",
    tag: "HI-3",
    displayFormat: "RED COLOUR",
    type: "DIGITAL_INPUT",
    dataType: "Boolean",
  },
  {
    id: 5,
    tagId: "DI-005",
    description: "MIXER VFD RUN F/B",
    tag: "HI-3",
    displayFormat: "RED COLOUR",
    type: "DIGITAL_INPUT",
    dataType: "Boolean",
  },
  {
    id: 6,
    tagId: "DI-006",
    description: "MIXER VFD HEALTHY F/B",
    tag: "HI-5",
    displayFormat: "GREEN COLOUR",
    type: "DIGITAL_INPUT",
    dataType: "Boolean",
  },
  {
    id: 7,
    tagId: "DI-007",
    description: "CIRCULATION PUMP TRIP F/B",
    tag: "HI-6",
    displayFormat: "RED COLOUR",
    type: "DIGITAL_INPUT",
    dataType: "Boolean",
  },
  {
    id: 8,
    tagId: "DI-008",
    description: "CIRCULATION PUMP RUN F/B",
    tag: "HI-7",
    displayFormat: "YELLOW COLOUR",
    type: "DIGITAL_INPUT",
    dataType: "Boolean",
  },
];

// DIGITAL OUTPUT TAGS
const DIGITAL_OUTPUT_TAGS = [
  {
    id: 1,
    tagId: "DO-001",
    description: "BUZZER ON (STATUS)",
    tag: "HI-0",
    displayFormat: "RED COLOUR",
    type: "DIGITAL_OUTPUT",
    dataType: "Boolean",
  },
  {
    id: 2,
    tagId: "DO-002",
    description: "EMERGENCY STOP OPERATED (STATUS)",
    tag: "HI-1",
    displayFormat: "RED COLOUR",
    type: "DIGITAL_OUTPUT",
    dataType: "Boolean",
  },
  {
    id: 3,
    tagId: "DO-003",
    description: "CIP VALVE-1 ON (STATUS)",
    tag: "HI-2",
    displayFormat: "YELLOW COLOUR",
    type: "DIGITAL_OUTPUT",
    dataType: "Boolean",
  },
  {
    id: 4,
    tagId: "DO-004",
    description: "SIP VALVE-1 ON (STATUS)",
    tag: "HI-3",
    displayFormat: "GREEN COLOUR",
    type: "DIGITAL_OUTPUT",
    dataType: "Boolean",
  },
];

// ANALOG INPUT TAGS
const ANALOG_INPUT_TAGS = [
  {
    id: 1,
    tagId: "AI-001",
    description: "LINE 1 - PRESSURE TRANSMITTER",
    tag: "HI23",
    dataType: "REAL",
    minValue: 0,
    maxValue: 10,
    unit: "0-10 bar",
    displayUnit: "32 bit (Float)",
    baseValue: 5,
    volatility: 1.5,
  },
  {
    id: 2,
    tagId: "AI-002",
    description: "LINE 1 - TEMPERATURE TRANSMITTER",
    tag: "HI32",
    dataType: "REAL",
    minValue: 0,
    maxValue: 100,
    unit: "0-100 Deg Cel",
    displayUnit: "32 bit (Float)",
    baseValue: 50,
    volatility: 8,
  },
  {
    id: 3,
    tagId: "AI-003",
    description: "LINE 2 - TEMPERATURE TRANSMITTER",
    tag: "HI24",
    dataType: "REAL",
    minValue: 0,
    maxValue: 100,
    unit: "0-100 Deg Cel",
    displayUnit: "32 bit (Float)",
    baseValue: 48,
    volatility: 7,
  },
  {
    id: 4,
    tagId: "AI-004",
    description: "DO TRANSMITTER",
    tag: "HI26",
    dataType: "REAL",
    minValue: 0,
    maxValue: 100,
    unit: "%",
    displayUnit: "32 bit (Float)",
    baseValue: 45,
    volatility: 12,
  },
  {
    id: 5,
    tagId: "AI-005",
    description: "LOAD CELL",
    tag: "HI31",
    dataType: "REAL",
    minValue: 0,
    maxValue: 50,
    unit: "kg",
    displayUnit: "32 bit (Float)",
    baseValue: 25,
    volatility: 3,
  },
  {
    id: 6,
    tagId: "AI-006",
    description: "COND PH SENSOR TRANSMITTER",
    tag: "HI30",
    dataType: "REAL",
    minValue: 0,
    maxValue: 14,
    unit: "pH",
    displayUnit: "32 bit (Float)",
    baseValue: 7,
    volatility: 0.8,
  },
  {
    id: 7,
    tagId: "AI-007",
    description: "MAGNETIC MIXER",
    tag: "HI33",
    dataType: "REAL",
    minValue: 0,
    maxValue: 1500,
    unit: "RPM",
    displayUnit: "32 bit (Float)",
    baseValue: 1100,
    volatility: 80,
  },
];

// ANALOG OUTPUT TAGS
const ANALOG_OUTPUT_TAGS = [
  {
    id: 1,
    tagId: "AO-001",
    description: "CONTROL VALVE (STATUS)",
    tag: "HI40",
    dataType: "INT",
    minValue: 0,
    maxValue: 100,
    unit: "%",
    displayUnit: "16 Bit",
    baseValue: 50,
    volatility: 15,
  },
];

// Utility Functions
function generateRandomBoolean() {
  return Math.random() > 0.5;
}

function generateRandomValue(baseValue, volatility, minValue, maxValue) {
  const variation = (Math.random() - 0.5) * 2 * volatility;
  const newValue = baseValue + variation;
  return Math.max(
    minValue,
    Math.min(maxValue, parseFloat(newValue.toFixed(2)))
  );
}

function getAnalogStatus(value, minValue, maxValue) {
  const range = maxValue - minValue;
  const normalMax = minValue + range * 0.6;
  const moderateMax = minValue + range * 0.8;

  if (value >= moderateMax) return "CRITICAL";
  if (value >= normalMax) return "MODERATE";
  return "HEALTHY";
}

// Initialize Database
async function initializeDatabase() {
  const connection = await pool.getConnection();
  try {
    console.log("📊 Initializing database...\n");

    // Digital Input Tags Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS digital_input_tags (
        id INT PRIMARY KEY,
        tag_id VARCHAR(20) NOT NULL UNIQUE,
        description VARCHAR(255) NOT NULL,
        tag VARCHAR(20),
        display_format VARCHAR(50),
        type VARCHAR(50),
        data_type VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Digital Input Readings Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS digital_input_readings (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        tag_id VARCHAR(20) NOT NULL,
        value BOOLEAN NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tag_id) REFERENCES digital_input_tags(tag_id),
        INDEX idx_tag_timestamp (tag_id, timestamp)
      )
    `);

    // Digital Output Tags Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS digital_output_tags (
        id INT PRIMARY KEY,
        tag_id VARCHAR(20) NOT NULL UNIQUE,
        description VARCHAR(255) NOT NULL,
        tag VARCHAR(20),
        display_format VARCHAR(50),
        type VARCHAR(50),
        data_type VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Digital Output Readings Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS digital_output_readings (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        tag_id VARCHAR(20) NOT NULL,
        value BOOLEAN NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tag_id) REFERENCES digital_output_tags(tag_id),
        INDEX idx_tag_timestamp (tag_id, timestamp)
      )
    `);

    // Analog Input Tags Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS analog_input_tags (
        id INT PRIMARY KEY,
        tag_id VARCHAR(20) NOT NULL UNIQUE,
        description VARCHAR(255) NOT NULL,
        tag VARCHAR(20),
        data_type VARCHAR(20),
        min_value DECIMAL(10,2),
        max_value DECIMAL(10,2),
        unit VARCHAR(50),
        display_unit VARCHAR(50),
        base_value DECIMAL(10,2),
        volatility DECIMAL(5,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Analog Input Readings Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS analog_input_readings (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        tag_id VARCHAR(20) NOT NULL,
        value DECIMAL(10,2) NOT NULL,
        status VARCHAR(20),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tag_id) REFERENCES analog_input_tags(tag_id),
        INDEX idx_tag_timestamp (tag_id, timestamp)
      )
    `);

    // Analog Output Tags Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS analog_output_tags (
        id INT PRIMARY KEY,
        tag_id VARCHAR(20) NOT NULL UNIQUE,
        description VARCHAR(255) NOT NULL,
        tag VARCHAR(20),
        data_type VARCHAR(20),
        min_value DECIMAL(10,2),
        max_value DECIMAL(10,2),
        unit VARCHAR(50),
        display_unit VARCHAR(50),
        base_value DECIMAL(10,2),
        volatility DECIMAL(5,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Analog Output Readings Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS analog_output_readings (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        tag_id VARCHAR(20) NOT NULL,
        value DECIMAL(10,2) NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tag_id) REFERENCES analog_output_tags(tag_id),
        INDEX idx_tag_timestamp (tag_id, timestamp)
      )
    `);

    // Alarms Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS alarms (
        id VARCHAR(50) PRIMARY KEY,
        tag_id VARCHAR(20) NOT NULL,
        tag_type VARCHAR(50) NOT NULL,
        priority VARCHAR(20) NOT NULL,
        description VARCHAR(255) NOT NULL,
        triggered_value VARCHAR(100),
        triggered_at TIMESTAMP NOT NULL,
        acknowledged_at TIMESTAMP NULL,
        resolved_at TIMESTAMP NULL,
        status VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_priority_status (priority, status),
        INDEX idx_triggered_at (triggered_at)
      )
    `);

    console.log("✅ Database tables created/verified\n");

    // Insert Digital Input Tags
    for (const tag of DIGITAL_INPUT_TAGS) {
      await connection.execute(
        `INSERT INTO digital_input_tags (id, tag_id, description, tag, display_format, type, data_type)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE description=VALUES(description)`,
        [
          tag.id,
          tag.tagId,
          tag.description,
          tag.tag,
          tag.displayFormat,
          tag.type,
          tag.dataType,
        ]
      );
    }
    console.log(
      `✅ ${DIGITAL_INPUT_TAGS.length} Digital Input tags initialized`
    );

    // Insert Digital Output Tags
    for (const tag of DIGITAL_OUTPUT_TAGS) {
      await connection.execute(
        `INSERT INTO digital_output_tags (id, tag_id, description, tag, display_format, type, data_type)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE description=VALUES(description)`,
        [
          tag.id,
          tag.tagId,
          tag.description,
          tag.tag,
          tag.displayFormat,
          tag.type,
          tag.dataType,
        ]
      );
    }
    console.log(
      `✅ ${DIGITAL_OUTPUT_TAGS.length} Digital Output tags initialized`
    );

    // Insert Analog Input Tags
    for (const tag of ANALOG_INPUT_TAGS) {
      await connection.execute(
        `INSERT INTO analog_input_tags (id, tag_id, description, tag, data_type, min_value, max_value, unit, display_unit, base_value, volatility)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE description=VALUES(description)`,
        [
          tag.id,
          tag.tagId,
          tag.description,
          tag.tag,
          tag.dataType,
          tag.minValue,
          tag.maxValue,
          tag.unit,
          tag.displayUnit,
          tag.baseValue,
          tag.volatility,
        ]
      );
    }
    console.log(`✅ ${ANALOG_INPUT_TAGS.length} Analog Input tags initialized`);

    // Insert Analog Output Tags
    for (const tag of ANALOG_OUTPUT_TAGS) {
      await connection.execute(
        `INSERT INTO analog_output_tags (id, tag_id, description, tag, data_type, min_value, max_value, unit, display_unit, base_value, volatility)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE description=VALUES(description)`,
        [
          tag.id,
          tag.tagId,
          tag.description,
          tag.tag,
          tag.dataType,
          tag.minValue,
          tag.maxValue,
          tag.unit,
          tag.displayUnit,
          tag.baseValue,
          tag.volatility,
        ]
      );
    }
    console.log(
      `✅ ${ANALOG_OUTPUT_TAGS.length} Analog Output tags initialized\n`
    );
  } catch (error) {
    console.error("❌ Database initialization error:", error);
    throw error;
  } finally {
    connection.release();
  }
}

// Generate and Store Real-Time Data
async function streamTagData(intervalMs = 30000, durationSec = null) {
  const startTime = Date.now();
  let readingCount = 0;
  const alarmTracker = new Map();
  let streamCounter = 0;

  console.log(`\n🚀 Starting data stream (every ${intervalMs}ms)\n`);

  const streamInterval = setInterval(async () => {
    const connection = await pool.getConnection();
    const timestamp = new Date();
    streamCounter++;

    try {
      // Initialize data object for JSON output
      const jsonData = {
        timestamp: timestamp.toISOString(),
        username: "Mildred Harvey",
        userEmail: "mildredharvey@gmail.com",
        lastUpdated: timestamp.toLocaleTimeString(),
        streamNumber: streamCounter,
        Dashboard: {
          equipmentStatusOverview: {
            equipment: [],
            summary: {
              totalEquipment: 0,
              healthy: 0,
              warning: 0,
              critical: 0,
            },
          },
          digitalInputs: [],
          digitalOutputs: [],
          analogInputs: [],
          analogOutputs: [],
          systemStatus: {
            totalAlarms: 0,
            totalResolved: 0,
            averageResponseTime: "N/A",
            summary: {
              critical: 0,
              warning: 0,
              healthy: 0,
            },
            recentAlarmDescriptions: [],
          },
        },
      };

      // Stream Digital Input Tags
      for (const tag of DIGITAL_INPUT_TAGS) {
        const value = generateRandomBoolean();
        const status = value ? "Healthy" : "Fault";

        await connection.execute(
          `INSERT INTO digital_input_readings (tag_id, value, timestamp) VALUES (?, ?, ?)`,
          [tag.tagId, value ? 1 : 0, timestamp]
        );
        readingCount++;

        // Add to equipment overview
        jsonData.Dashboard.equipmentStatusOverview.equipment.push({
          id: tag.tagId,
          name: tag.description,
          status: status,
        });

        jsonData.Dashboard.digitalInputs.push({
          tagId: tag.tagId,
          description: tag.description,
          value: value,
          status: status,
          tag: tag.tag,
          displayFormat: tag.displayFormat,
          timestamp: timestamp.toISOString(),
        });

        // Update summary
        if (status === "Healthy") {
          jsonData.Dashboard.equipmentStatusOverview.summary.healthy++;
        } else {
          jsonData.Dashboard.equipmentStatusOverview.summary.warning++;
        }
      }

      // Stream Digital Output Tags
      for (const tag of DIGITAL_OUTPUT_TAGS) {
        const value = generateRandomBoolean();
        const status = value ? "On" : "Off";

        await connection.execute(
          `INSERT INTO digital_output_readings (tag_id, value, timestamp) VALUES (?, ?, ?)`,
          [tag.tagId, value ? 1 : 0, timestamp]
        );
        readingCount++;

        jsonData.Dashboard.digitalOutputs.push({
          tagId: tag.tagId,
          description: tag.description,
          value: value,
          status: status,
          tag: tag.tag,
          displayFormat: tag.displayFormat,
          timestamp: timestamp.toISOString(),
        });
      }

      // Stream Analog Input Tags
      for (const tag of ANALOG_INPUT_TAGS) {
        const value = generateRandomValue(
          tag.baseValue,
          tag.volatility,
          tag.minValue,
          tag.maxValue
        );
        const status = getAnalogStatus(value, tag.minValue, tag.maxValue);
        const statusLabel =
          status === "CRITICAL"
            ? "Critical"
            : status === "MODERATE"
            ? "Moderate"
            : "Healthy";

        await connection.execute(
          `INSERT INTO analog_input_readings (tag_id, value, status, timestamp) VALUES (?, ?, ?, ?)`,
          [tag.tagId, value, status, timestamp]
        );
        readingCount++;

        jsonData.Dashboard.analogInputs.push({
          tagId: tag.tagId,
          name: tag.description,
          value: value,
          unit: tag.unit,
          status: statusLabel,
          currentStatus: status,
          lastUpdated: timestamp.toLocaleTimeString(),
          chart: {
            min: tag.minValue,
            max: tag.maxValue,
            zones: [
              {
                start: tag.minValue,
                end: tag.minValue + (tag.maxValue - tag.minValue) * 0.6,
                label: "Normal",
              },
              {
                start: tag.minValue + (tag.maxValue - tag.minValue) * 0.6,
                end: tag.minValue + (tag.maxValue - tag.minValue) * 0.8,
                label: "Moderate",
              },
              {
                start: tag.minValue + (tag.maxValue - tag.minValue) * 0.8,
                end: tag.maxValue,
                label: "Critical",
              },
            ],
          },
          tag: tag.tag,
          timestamp: timestamp.toISOString(),
        });

        // Create alarm if CRITICAL
        if (status === "CRITICAL") {
          const alarmKey = tag.tagId;
          const previousStatus = alarmTracker.get(alarmKey);

          if (!previousStatus || previousStatus !== "CRITICAL") {
            const alarmId = `ALM-${Date.now()}-${tag.tagId}`;
            await connection.execute(
              `INSERT INTO alarms (id, tag_id, tag_type, priority, description, triggered_value, triggered_at, status)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                alarmId,
                tag.tagId,
                "ANALOG_INPUT",
                "CRITICAL",
                `${tag.description} - Critical Value: ${value} ${tag.unit}`,
                `${value} ${tag.unit}`,
                timestamp,
                "ACTIVE",
              ]
            );

            jsonData.Dashboard.systemStatus.summary.critical++;
            jsonData.Dashboard.systemStatus.recentAlarmDescriptions.push({
              priority: "CRITICAL",
              name: tag.description,
              description: `Critical Value: ${value} ${tag.unit}. Requires immediate inspection`,
              timestamp: timestamp.toLocaleTimeString(),
            });

            console.log(
              `🚨 [${timestamp.toLocaleTimeString()}] CRITICAL: ${
                tag.description
              } = ${value} ${tag.unit}`
            );
          }
          jsonData.Dashboard.equipmentStatusOverview.summary.critical++;
          alarmTracker.set(alarmKey, "CRITICAL");
        } else if (status === "MODERATE") {
          jsonData.Dashboard.systemStatus.summary.warning++;
        } else {
          jsonData.Dashboard.systemStatus.summary.healthy++;
          alarmTracker.delete(tag.tagId);
        }
      }

      // Stream Analog Output Tags
      for (const tag of ANALOG_OUTPUT_TAGS) {
        const value = generateRandomValue(
          tag.baseValue,
          tag.volatility,
          tag.minValue,
          tag.maxValue
        );
        await connection.execute(
          `INSERT INTO analog_output_readings (tag_id, value, timestamp) VALUES (?, ?, ?)`,
          [tag.tagId, value, timestamp]
        );
        readingCount++;

        jsonData.Dashboard.analogOutputs.push({
          tagId: tag.tagId,
          name: tag.description,
          value: value,
          unit: tag.unit,
          minValue: tag.minValue,
          maxValue: tag.maxValue,
          status: "On",
          tag: tag.tag,
          openingPercentage: value,
          timestamp: timestamp.toISOString(),
        });
      }

      // Update equipment summary counts
      jsonData.Dashboard.equipmentStatusOverview.summary.totalEquipment =
        jsonData.Dashboard.equipmentStatusOverview.equipment.length;

      // Update system status
      jsonData.Dashboard.systemStatus.totalAlarms = alarmTracker.size;
      jsonData.Dashboard.systemStatus.averageResponseTime = "2m 30s";

      const totalTags =
        DIGITAL_INPUT_TAGS.length +
        DIGITAL_OUTPUT_TAGS.length +
        ANALOG_INPUT_TAGS.length +
        ANALOG_OUTPUT_TAGS.length;

      // Console output JSON
      console.log("\n" + "═".repeat(80));
      console.log(
        `📊 STREAM #${streamCounter} - ${timestamp.toLocaleTimeString()}`
      );
      console.log("═".repeat(80));
      console.log(JSON.stringify(jsonData, null, 2));
      console.log("═".repeat(80) + "\n");

      console.log(
        `📈 [${timestamp.toLocaleTimeString()}] Readings: ${readingCount} | Active Alarms: ${
          alarmTracker.size
        }/${totalTags}\n`
      );

      // Check duration
      if (durationSec && (Date.now() - startTime) / 1000 >= durationSec) {
        clearInterval(streamInterval);
        console.log(`\n✅ Data streaming completed (${durationSec}s)`);
        process.exit(0);
      }
    } catch (error) {
      console.error("❌ Streaming error:", error);
    } finally {
      connection.release();
    }
  }, intervalMs);

  // Graceful shutdown
  process.on("SIGINT", () => {
    clearInterval(streamInterval);
    console.log("\n⏹️  Data streaming stopped");
    pool.end(() => process.exit(0));
  });
}

// Dashboard Summary
async function getDashboardSummary() {
  const connection = await pool.getConnection();
  try {
    const [diCount] = await connection.execute(
      `SELECT COUNT(*) as count FROM digital_input_readings WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 1 MINUTE)`
    );
    const [doCount] = await connection.execute(
      `SELECT COUNT(*) as count FROM digital_output_readings WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 1 MINUTE)`
    );
    const [aiCount] = await connection.execute(
      `SELECT COUNT(*) as count FROM analog_input_readings WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 1 MINUTE)`
    );
    const [aoCount] = await connection.execute(
      `SELECT COUNT(*) as count FROM analog_output_readings WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 1 MINUTE)`
    );
    const [alarmCount] = await connection.execute(
      `SELECT COUNT(*) as count FROM alarms WHERE status = 'ACTIVE'`
    );

    console.log("\n📊 DASHBOARD SUMMARY (Last 1 Minute)");
    console.log("═══════════════════════════════════════");
    console.log(`Digital Input Readings: ${diCount[0].count}`);
    console.log(`Digital Output Readings: ${doCount[0].count}`);
    console.log(`Analog Input Readings: ${aiCount[0].count}`);
    console.log(`Analog Output Readings: ${aoCount[0].count}`);
    console.log(`Active Alarms: ${alarmCount[0].count}`);
    console.log("═══════════════════════════════════════\n");
  } finally {
    connection.release();
  }
}

// Main Execution
async function main() {
  try {
    await initializeDatabase();
    await getDashboardSummary();

    // Stream for 1 hour or infinite if duration is null
    await streamTagData(15000, null);
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

main();
