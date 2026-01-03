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
    const { limit=8  } = req.query;
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
// GET all analog input tags
app.get("/api/analog-inputs/tags", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      "SELECT * FROM analog_input_tags ORDER BY id"
    );
    connection.release();

    apiResponse(res, 200, "Analog input tags retrieved", rows);
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
    const limit = Number(req.query.limit) || 1000000;

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
    query += ` ORDER BY air.id LIMIT ${limit}`;

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

// ==================== EQUIPMENT STATUS APIS ====================

// GET equipment status derived from digital inputs
app.get("/api/equipment-status", async (req, res) => {
  try {
    const connection = await pool.getConnection();

    // Get latest readings for all digital inputs
    const [latestReadings] = await connection.execute(`
      SELECT 
        dir.tag_id,
        dir.value,
        dit.description,
        MAX(dir.timestamp) as timestamp
      FROM digital_input_readings dir
      JOIN digital_input_tags dit ON dir.tag_id = dit.tag_id
      GROUP BY dir.tag_id
      ORDER BY dit.id
    `);

    connection.release();

    // Map digital inputs to equipment status
    const equipmentStatus = {};
    
    // Create a lookup map for quick access
    const readings = {};
    latestReadings.forEach(reading => {
      readings[reading.tag_id] = reading;
    });

    // 1. VOLTAGE PROTECTION - DI-001
    equipmentStatus.voltageProtection = {
      name: "Voltage Protection",
      status: readings['DI-001']?.value === 1 ? "unhealthy" : "healthy",
      value: readings['DI-001']?.value,
      timestamp: readings['DI-001']?.timestamp
    };

    // 2. EMERGENCY STOP - DI-002
    equipmentStatus.emergencyStop = {
      name: "Emergency Stop",
      status: readings['DI-002']?.value === 1 ? "operated" : "healthy",
      value: readings['DI-002']?.value,
      timestamp: readings['DI-002']?.timestamp
    };

    // 3. BUZZER RESET PB - DI-003
    equipmentStatus.buzzerReset = {
      name: "Buzzer Reset PB",
      status: readings['DI-003']?.value === 1 ? "operated" : "unoperated",
      value: readings['DI-003']?.value,
      timestamp: readings['DI-003']?.timestamp
    };

    // 4. MIXER VFD TRIP - DI-004
    equipmentStatus.mixerVfdTrip = {
      name: "Mixer VFD Trip",
      status: readings['DI-004']?.value === 1 ? "operated" : "unoperated",
      value: readings['DI-004']?.value,
      timestamp: readings['DI-004']?.timestamp
    };

    // 5. MIXER VFD RUNNING - DI-005
    equipmentStatus.mixerVfdRunning = {
      name: "Mixer VFD Running",
      status: readings['DI-005']?.value === 1 ? "running" : "not running",
      value: readings['DI-005']?.value,
      timestamp: readings['DI-005']?.timestamp
    };

    // 6. MIXER VFD HEALTHY - DI-006 (opposite of trip: if DI-004 operated then unhealthy)
    equipmentStatus.mixerVfdHealth = {
      name: "Mixer VFD Health",
      status: readings['DI-004']?.value === 1 ? "unhealthy" : "healthy",
      basedOnTrip: true,
      tripValue: readings['DI-004']?.value,
      timestamp: readings['DI-004']?.timestamp
    };

    // 7. CIRCULATION PUMP TRIP - DI-007
    equipmentStatus.circulationPumpTrip = {
      name: "Circulation Pump Trip",
      status: readings['DI-007']?.value === 1 ? "operated" : "unoperated",
      value: readings['DI-007']?.value,
      timestamp: readings['DI-007']?.timestamp
    };

    // 8. CIRCULATION PUMP RUNNING & HEALTH - DI-008
    // Health is opposite to pump run: if running (1) then healthy, if not running (0) then unhealthy
    equipmentStatus.circulationPumpHealth = {
      name: "Circulation Pump Health",
      status: readings['DI-008']?.value === 1 ? "healthy" : "unhealthy",
      basedOnRun: true,
      runValue: readings['DI-008']?.value,
      runStatus: readings['DI-008']?.value === 1 ? "running" : "not running",
      timestamp: readings['DI-008']?.timestamp
    };

    apiResponse(res, 200, "Equipment status retrieved", equipmentStatus);
  } catch (error) {
    handleError(res, error);
  }
});

// ==================== ALARM APIS ====================

// GET all alarms with filters (status, priority, tag_id, date range)
app.get("/api/alarms", async (req, res) => {
  try {
    const { status , priority, tag_id, startDate, endDate, limit = 100000, offset = 0 } = req.query;
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

    if (tag_id) {
      query += ` AND tag_id = '${tag_id}'`;
    }

    if (startDate) {
      query += ` AND triggered_at >= '${startDate}'`;
    }

    if (endDate) {
      query += ` AND triggered_at <= '${endDate}'`;
    }

    query += ` ORDER BY triggered_at DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

    const [rows] = await connection.execute(query);
    connection.release();

    apiResponse(res, 200, "Alarms retrieved", {
      limit: Number(limit),
      offset: Number(offset),
      filters: {
        status,
        priority,
        tag_id,
        dateRange: { startDate, endDate }
      },
      alarms: rows
    });
  } catch (error) {
    handleError(res, error);
  }
});

//Custom range Query for Alarms




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
        SUM(CASE WHEN priority = 'HEALTHY' THEN 1 ELSE 0 END) as healthy,
        ROUND(AVG(TIMESTAMPDIFF(SECOND, triggered_at, resolved_at)) / 60, 2) as avg_resolution_time_minutes,
        ROUND(AVG(TIMESTAMPDIFF(SECOND, triggered_at, acknowledged_at)) / 60, 2) as avg_acknowledgement_time_minutes,
        MIN(triggered_at) as first_alarm_at,
        MAX(resolved_at) as last_resolved_at
      FROM alarms
    `);

    connection.release();

    const summaryData = stats[0] || {};
    
    apiResponse(res, 200, "Alarm statistics retrieved", {
      total: summaryData.total || 0,
      active: summaryData.active || 0,
      resolved: summaryData.resolved || 0,
      bySeverity: {
        critical: summaryData.critical || 0,
        moderate: summaryData.moderate || 0,
        healthy: summaryData.healthy || 0
      },
      responseMetrics: {
        avgResolutionTimeMinutes: parseFloat(summaryData.avg_resolution_time_minutes) || 0,
        avgAcknowledgementTimeMinutes: parseFloat(summaryData.avg_acknowledgement_time_minutes) || 0,
        firstAlarmAt: summaryData.first_alarm_at,
        lastResolvedAt: summaryData.last_resolved_at
      }
    });
  } catch (error) {
    handleError(res, error);
  }
});


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



// GET machine runtime statistics - Complete Dashboard View
app.get("/api/machine-runtime/overview", async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();

    // Get current 24-hour runtime data
    const [runtimeData24h] = await connection.execute(`
      SELECT 
        SUM(CASE WHEN value = 1 THEN 1 ELSE 0 END) as running_count,
        SUM(CASE WHEN value = 0 THEN 1 ELSE 0 END) as idle_count,
        COUNT(*) as total_readings
      FROM digital_input_readings
      WHERE tag_id = 'DI-005' 
        AND timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `);

    // Get 7-day runtime breakdown by day
    const [runtimeBy7Days] = await connection.execute(`
      SELECT 
        DATE(timestamp) as date,
        SUM(CASE WHEN value = 1 THEN 1 ELSE 0 END) as running_count,
        SUM(CASE WHEN value = 0 THEN 1 ELSE 0 END) as idle_count,
        COUNT(*) as total_readings,
        ROUND((SUM(CASE WHEN value = 1 THEN 1 ELSE 0 END) / COUNT(*) * 100), 2) as runtime_percentage
      FROM digital_input_readings
      WHERE tag_id = 'DI-005' 
        AND timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(timestamp)
      ORDER BY date DESC
    `);

    // Calculate current runtime metrics (24h)
    const totalReadings = runtimeData24h[0]?.total_readings || 0;
    const runningCount = runtimeData24h[0]?.running_count || 0;
    const idleCount = runtimeData24h[0]?.idle_count || 0;
    const runtimePercentage = totalReadings > 0 ? parseFloat(((runningCount / totalReadings) * 100).toFixed(2)) : 0;

    // Assuming 30-second intervals between readings
    const readingIntervalSeconds = 30;
    const runtimeSeconds = runningCount * readingIntervalSeconds;
    const runtimeHours = parseFloat((runtimeSeconds / 3600).toFixed(2));
    const runtimeMinutes = parseFloat(((runtimeSeconds % 3600) / 60).toFixed(0));

    // Get equipment runtime breakdown (MIXER & PUMP)
    const [equipmentRuntime] = await connection.execute(`
      SELECT 
        tag_id,
        (SELECT description FROM digital_input_tags WHERE tag_id = dir.tag_id LIMIT 1) as description,
        SUM(CASE WHEN value = 1 THEN 1 ELSE 0 END) as running_count,
        COUNT(*) as total_readings,
        ROUND((SUM(CASE WHEN value = 1 THEN 1 ELSE 0 END) / COUNT(*) * 100), 2) as runtime_percentage,
        MAX(timestamp) as last_updated
      FROM digital_input_readings dir
      WHERE tag_id IN ('DI-005', 'DI-008')
        AND timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      GROUP BY tag_id
      ORDER BY runtime_percentage DESC
    `);

    // Get machine status pie chart (Running, Ideal, Downtime distribution)
    const [machineStatus] = await connection.execute(`
      SELECT 
        tag_id,
        (SELECT description FROM digital_input_tags WHERE tag_id = dir.tag_id LIMIT 1) as description,
        CASE 
          WHEN SUM(CASE WHEN value = 1 THEN 1 ELSE 0 END) / COUNT(*) >= 0.8 THEN 'Running'
          WHEN SUM(CASE WHEN value = 1 THEN 1 ELSE 0 END) / COUNT(*) >= 0.5 THEN 'Ideal'
          ELSE 'Downtime'
        END as status,
        COUNT(*) as count
      FROM digital_input_readings
      WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        AND tag_id IN ('DI-005', 'DI-008')
      GROUP BY tag_id
    `);

    // Get hourly runtime distribution (for chart)
    const [hourlyRuntime] = await connection.execute(`
      SELECT 
        DATE_FORMAT(timestamp, '%Y-%m-%d %H:00:00') as hour,
        SUM(CASE WHEN value = 1 THEN 1 ELSE 0 END) as running_count,
        COUNT(*) as total_readings,
        ROUND((SUM(CASE WHEN value = 1 THEN 1 ELSE 0 END) / COUNT(*) * 100), 2) as runtime_percentage
      FROM digital_input_readings
      WHERE tag_id = 'DI-005'
        AND timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      GROUP BY DATE_FORMAT(timestamp, '%Y-%m-%d %H:00:00')
      ORDER BY hour ASC
    `);

    // Get status breakdown for pie chart
    const statusCounts = {
      running: 0,
      ideal: 0,
      fault: 0,
      downtime: 0
    };

    for (const machine of machineStatus) {
      if (machine.status === 'Running') statusCounts.running++;
      else if (machine.status === 'Ideal') statusCounts.ideal++;
      else if (machine.status === 'Downtime') statusCounts.downtime++;
    }

    connection.release();

    // Calculate totals for pie chart
    const totalMachines = statusCounts.running + statusCounts.ideal + statusCounts.fault + statusCounts.downtime;

    apiResponse(res, 200, "Machine runtime overview retrieved", {
      currentMetrics: {
        runtimePercentage: runtimePercentage,
        runtimeHours: runtimeHours,
        runtimeMinutes: runtimeMinutes,
        idleTime: `${Math.floor((idleCount * readingIntervalSeconds) / 3600)}h ${Math.floor(((idleCount * readingIntervalSeconds) % 3600) / 60)}m`,
        totalReadings: totalReadings
      },
      equipmentBreakdown: equipmentRuntime.map(eq => ({
        tagId: eq.tag_id,
        description: eq.description,
        runtimePercentage: parseFloat(eq.runtime_percentage),
        runtimeHours: parseFloat(((eq.running_count * readingIntervalSeconds) / 3600).toFixed(2)),
        lastUpdated: eq.last_updated
      })),
      statusDistribution: {
        running: statusCounts.running,
        ideal: statusCounts.ideal,
        fault: statusCounts.fault,
        downtime: statusCounts.downtime,
        total: totalMachines
      },
      dailyBreakdown: runtimeBy7Days.map(day => ({
        date: day.date,
        runtimePercentage: parseFloat(day.runtime_percentage),
        runtimeHours: parseFloat(((day.running_count * readingIntervalSeconds) / 3600).toFixed(2)),
        runningCount: day.running_count,
        idleCount: day.idle_count
      })),
      hourlyTrend: hourlyRuntime.map(hour => ({
        time: hour.hour,
        runtimePercentage: parseFloat(hour.runtime_percentage),
        runningCount: hour.running_count,
        totalCount: hour.total_readings
      }))
    });
  } catch (error) {
    handleError(res, error);
  } finally {
    if (connection) connection.release();
  }
});

// GET machine runtime by equipment with actual running time
app.get("/api/machine-runtime/by-equipment", async (req, res) => {
  let connection;
  try {
    const { days = 7 } = req.query;

    connection = await pool.getConnection();

    const [runtimeByEquipment] = await connection.execute(`
      SELECT 
        dir.tag_id,
        (SELECT description FROM digital_input_tags WHERE tag_id = dir.tag_id LIMIT 1) as description,
        DATE(dir.timestamp) as date,
        SUM(CASE WHEN dir.value = 1 THEN 1 ELSE 0 END) as running_count,
        COUNT(*) as total_readings,
        ROUND((SUM(CASE WHEN dir.value = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as runtime_percentage
      FROM digital_input_readings dir
      WHERE dir.timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND dir.tag_id IN ('DI-005', 'DI-008')
      GROUP BY dir.tag_id, DATE(dir.timestamp)
      ORDER BY dir.tag_id, date DESC
    `, [parseInt(days)]);

    connection.release();

    // Calculate actual running time in hours and minutes for each record
    const formattedData = runtimeByEquipment.map(record => {
      const readingIntervalSeconds = 30;
      const runtimeSeconds = record.running_count * readingIntervalSeconds;
      const runtimeHours = Math.floor(runtimeSeconds / 3600);
      const runtimeMinutes = Math.floor((runtimeSeconds % 3600) / 60);
      
      return {
        tagId: record.tag_id,
        description: record.description,
        date: record.date,
        runningCount: record.running_count,
        totalReadings: record.total_readings,
        runtimePercentage: parseFloat(record.runtime_percentage),
        runtimeHours: runtimeHours,
        runtimeMinutes: runtimeMinutes,
        runtimeFormatted: `${runtimeHours}h ${runtimeMinutes}m`,
        totalRuntimeSeconds: runtimeSeconds
      };
    });

    apiResponse(res, 200, "Equipment runtime data retrieved", formattedData);
  } catch (error) {
    handleError(res, error);
  } finally {
    if (connection) connection.release();
  }
});

// GET total machine running time (summary)
app.get("/api/machine-runtime/total-time", async (req, res) => {
  let connection;
  try {
    const { days = 7, tagId = "DI-005" } = req.query;

    connection = await pool.getConnection();

    // Get total running time for specified period
    const [totalRuntime] = await connection.execute(`
      SELECT 
        COUNT(*) as total_readings,
        SUM(CASE WHEN value = 1 THEN 1 ELSE 0 END) as running_count,
        SUM(CASE WHEN value = 0 THEN 1 ELSE 0 END) as idle_count,
        MIN(timestamp) as start_time,
        MAX(timestamp) as end_time
      FROM digital_input_readings
      WHERE tag_id = ? AND timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [tagId, parseInt(days)]);

    // Get running time by each continuous session
    const [runningSessions] = await connection.execute(`
      SELECT 
        MIN(timestamp) as session_start,
        MAX(timestamp) as session_end,
        COUNT(*) as reading_count,
        DATE(timestamp) as session_date
      FROM digital_input_readings
      WHERE tag_id = ? AND value = 1 AND timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY SESSION_ID, DATE(timestamp)
      ORDER BY session_start DESC
      LIMIT 100
    `, [tagId, parseInt(days)]);

    const readingIntervalSeconds = 30;
    const data = totalRuntime[0];
    
    const totalReadingSeconds = data.total_readings * readingIntervalSeconds;
    const totalPeriodHours = Math.floor(totalReadingSeconds / 3600);
    const totalPeriodMinutes = Math.floor((totalReadingSeconds % 3600) / 60);

    const runningSeconds = data.running_count * readingIntervalSeconds;
    const runningHours = Math.floor(runningSeconds / 3600);
    const runningMinutes = Math.floor((runningSeconds % 3600) / 60);

    const idleSeconds = data.idle_count * readingIntervalSeconds;
    const idleHours = Math.floor(idleSeconds / 3600);
    const idleMinutes = Math.floor((idleSeconds % 3600) / 60);

    const runtimePercentage = data.total_readings > 0 ? ((data.running_count / data.total_readings) * 100).toFixed(2) : 0;

    connection.release();

    apiResponse(res, 200, "Total machine running time retrieved", {
      period: {
        days: parseInt(days),
        startTime: data.start_time,
        endTime: data.end_time
      },
      summary: {
        totalReadings: data.total_readings,
        runtimePercentage: parseFloat(runtimePercentage),
        totalPeriod: {
          hours: totalPeriodHours,
          minutes: totalPeriodMinutes,
          formatted: `${totalPeriodHours}h ${totalPeriodMinutes}m`
        },
        runningTime: {
          hours: runningHours,
          minutes: runningMinutes,
          seconds: runningSeconds % 60,
          formatted: `${runningHours}h ${runningMinutes}m ${runningSeconds % 60}s`,
          totalSeconds: runningSeconds
        },
        idleTime: {
          hours: idleHours,
          minutes: idleMinutes,
          seconds: idleSeconds % 60,
          formatted: `${idleHours}h ${idleMinutes}m ${idleSeconds % 60}s`,
          totalSeconds: idleSeconds
        }
      },
      readingDetails: {
        runningReadings: data.running_count,
        idleReadings: data.idle_count,
        totalReadings: data.total_readings,
        readingIntervalSeconds: readingIntervalSeconds
      }
    });
  } catch (error) {
    handleError(res, error);
  } finally {
    if (connection) connection.release();
  }
});


// GET daily running time report (Running + Idle + Random Fault)
app.get("/api/machine-runtime/daily-report", async (req, res) => {
  let connection;
  try {
    const { days = 30, tagId = "DI-005" } = req.query;

    connection = await pool.getConnection();

    const [dailyRuntime] = await connection.execute(`
      SELECT 
        DATE(timestamp) as date,
        SUM(CASE WHEN value = 1 THEN 1 ELSE 0 END) as running_count,
        SUM(CASE WHEN value = 0 THEN 1 ELSE 0 END) as idle_count,
        COUNT(*) as total_readings,
        ROUND(
          (SUM(CASE WHEN value = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100,
          2
        ) as runtime_percentage,
        MIN(timestamp) as first_reading,
        MAX(timestamp) as last_reading
      FROM digital_input_readings
      WHERE tag_id = ?
        AND timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(timestamp)
      ORDER BY date DESC
    `, [tagId, parseInt(days)]);

    const readingIntervalSeconds = 30;

    const getRandomInt = (min, max) =>
      Math.floor(Math.random() * (max - min + 1)) + min;

    const formattedReport = dailyRuntime.map(day => {
      const totalSeconds = day.total_readings * readingIntervalSeconds;
      const runningSeconds = day.running_count * readingIntervalSeconds;

      // Random fault time (0–15%)
      const faultPercentage = getRandomInt(0, 15);
      const faultSeconds = Math.floor((faultPercentage / 100) * totalSeconds);

      // Idle time = remaining
      let idleSeconds = totalSeconds - runningSeconds - faultSeconds;
      if (idleSeconds < 0) idleSeconds = 0;

      const toTime = seconds => ({
        hours: Math.floor(seconds / 3600),
        minutes: Math.floor((seconds % 3600) / 60),
        totalSeconds: seconds,
        formatted: `${Math.floor(seconds / 3600)}h ${Math.floor(
          (seconds % 3600) / 60
        )}m`
      });

      return {
        date: day.date,
        runtimePercentage: parseFloat(day.runtime_percentage),

        runningTime: toTime(runningSeconds),
        idleTime: toTime(idleSeconds),
        faultTime: {
          ...toTime(faultSeconds),
          percentage: faultPercentage
        },

        readings: {
          running: day.running_count,
          idle: Math.floor(idleSeconds / readingIntervalSeconds),
          fault: Math.floor(faultSeconds / readingIntervalSeconds),
          total: day.total_readings
        },

        timeRange: {
          start: day.first_reading,
          end: day.last_reading
        }
      };
    });

    apiResponse(res, 200, "Daily running time report retrieved", {
      period: {
        days: parseInt(days),
        tagId
      },
      readingIntervalSeconds,
      dailyData: formattedReport
    });
  } catch (error) {
    handleError(res, error);
  } finally {
    if (connection) connection.release();
  }
});



// GET alarm frequency pie chart data (simplified)
app.get("/api/alarms/frequency/pie-chart", async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();

    const [pieData] = await connection.execute(`
      SELECT 
        priority,
        COUNT(*) as count,
        ROUND((COUNT(*) / (SELECT COUNT(*) FROM alarms) * 100), 2) as percentage
      FROM alarms
      GROUP BY priority
      ORDER BY 
        CASE 
          WHEN priority = 'CRITICAL' THEN 1
          WHEN priority = 'MODERATE' THEN 2
          ELSE 3
        END
    `);

    connection.release();

    const formattedData = pieData.map(item => ({
      name: item.priority,
      value: item.count,
      percentage: parseFloat(item.percentage)
    }));

    apiResponse(res, 200, "Alarm frequency pie chart data retrieved", formattedData);
  } catch (error) {
    handleError(res, error);
  } finally {
    if (connection) connection.release();
  }
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

  checkAlarms(digitalInputs, digitalOutputs, analogInputs, analogOutputs, timestamp) {
    const newAlarms = [];
    
    // Check Digital Inputs
    for (const input of digitalInputs) {
      const alarm = this.checkTagForAlarm(input, "DIGITAL_INPUT", timestamp);
      if (alarm) newAlarms.push(alarm);
    }
    
    // Check Digital Outputs
    for (const output of digitalOutputs) {
      const alarm = this.checkTagForAlarm(output, "DIGITAL_OUTPUT", timestamp);
      if (alarm) newAlarms.push(alarm);
    }
    
    // Check Analog Inputs
    for (const input of analogInputs) {
      const alarm = this.checkTagForAlarm(input, "ANALOG_INPUT", timestamp);
      if (alarm) newAlarms.push(alarm);
    }
    
    // Check Analog Outputs
    for (const output of analogOutputs) {
      const alarm = this.checkTagForAlarm(output, "ANALOG_OUTPUT", timestamp);
      if (alarm) newAlarms.push(alarm);
    }
    
    return newAlarms;
  }

  checkTagForAlarm(tag, tagType, timestamp) {
    const tagId = tag.tagId;
    const value = tag.value;
    const currentLevel = getAlarmLevel(tagId, value, tagType);
    const existingAlarm = this.activeAlarms.get(tagId);

    if (currentLevel !== "HEALTHY") {
      if (!existingAlarm || existingAlarm.level !== currentLevel) {
        const alarm = createAlarmObject(tagId, value, currentLevel, timestamp, tagType, tag);
        this.activeAlarms.set(tagId, alarm);
        this.totalAlarms++;
        return alarm;
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
    return null;
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

// Alarm thresholds for all tag types
//============================================================================
const ALARM_THRESHOLDS = {
  // Digital Inputs - alarm when value changes to 1 (trigger state)
  "DI-001": { moderate: 1, critical: 1, unit: "" },
  "DI-002": { moderate: 1, critical: 1, unit: "" },
  "DI-003": { moderate: 1, critical: 1, unit: "" },
  "DI-004": { moderate: 1, critical: 1, unit: "" },
  "DI-005": { moderate: 1, critical: 1, unit: "" },
  "DI-006": { moderate: 1, critical: 1, unit: "" },
  "DI-007": { moderate: 1, critical: 1, unit: "" },
  "DI-008": { moderate: 1, critical: 1, unit: "" },
  
  // Digital Outputs - alarm when value changes to 1
  "DO-001": { moderate: 1, critical: 1, unit: "" },
  "DO-002": { moderate: 1, critical: 1, unit: "" },
  "DO-003": { moderate: 1, critical: 1, unit: "" },
  "DO-004": { moderate: 1, critical: 1, unit: "" },
  
  // Analog Inputs
  "AI-001": { moderate: 5, critical: 8, unit: "bar" },
  "AI-002": { moderate: 50, critical: 75, unit: "°C" },
  "AI-003": { moderate: 50, critical: 75, unit: "°C" },
  "AI-004": { moderate: 30, critical: 50, unit: "%" },
  "AI-005": { moderate: 25, critical: 40, unit: "kg" },
  "AI-006": { moderate: 7, critical: 9, unit: "pH" },
  "AI-007": { moderate: 750, critical: 1200, unit: "RPM" },
  
  // Analog Outputs
  "AO-001": { moderate: 70, critical: 90, unit: "%" },
};

const ALARM_LEVELS = {
  CRITICAL: { priority: 1, color: "RED" },
  MODERATE: { priority: 2, color: "YELLOW" },
  HEALTHY: { priority: 3, color: "GREEN" },
};

const DIGITAL_INPUT_TAGS = [
  { id: 1, tagId: "DI-001", description: "Voltage Protection Relay" },
  { id: 2, tagId: "DI-002", description: "Emergency Stop" },
  { id: 3, tagId: "DI-003", description: "Buzzer Reset PB" },
  { id: 4, tagId: "DI-004", description: "Mixer VFD Run F/B" },
  { id: 5, tagId: "DI-005", description: "Mixer VFD Trip F/B" },
  { id: 6, tagId: "DI-006", description: "Mixer VFD Healthy F/B" },
  { id: 7, tagId: "DI-007", description: "Circulation Pump Trip F/B" },
  { id: 8, tagId: "DI-008", description: "Circulation Pump Run F/B" },
];

const DIGITAL_OUTPUT_TAGS = [
  { id: 1, tagId: "DO-001", description: "Buzzer" },
  { id: 2, tagId: "DO-002", description: "Emergency" },
  { id: 3, tagId: "DO-003", description: "CIP Valve-1 " },
  { id: 4, tagId: "DO-004", description: "SIP Valve-1 " },
];

const ANALOG_INPUT_TAGS = [
  { tagId: "AI-001", description: "Line 1 - Pressure", unit: "bar", baseValue: 5, volatility: 4, minValue: 0, maxValue: 10 },
  { tagId: "AI-002", description: "Line 1 - Temprature", unit: "°C", baseValue: 50, volatility: 30, minValue: 0, maxValue: 100 },
  { tagId: "AI-003", description: "Line 2 - Temprature", unit: "°C", baseValue: 48, volatility: 20, minValue: 0, maxValue: 100 },
  { tagId: "AI-004", description: "DO Trasnmitter", unit: "%", baseValue: 45, volatility: 12, minValue: 0, maxValue: 100 },
  { tagId: "AI-005", description: "Load Cell", unit: "kg", baseValue: 25, volatility: 3, minValue: 0, maxValue: 50 },
  { tagId: "AI-006", description: "Cond PH Sensor", unit: "pH", baseValue: 7, volatility: 0.8, minValue: 0, maxValue: 14 },
  { tagId: "AI-007", description: "Magnetic Mixer", unit: "RPM", baseValue: 1100, volatility: 80, minValue: 0, maxValue: 1500 },
];

const ANALOG_OUTPUT_TAGS = [
  { tagId: "AO-001", description: "Control Valve", unit: "%", baseValue: 50, volatility: 15, minValue: 0, maxValue: 100 },
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

function getAlarmLevel(tagId, value, tagType) {
  const threshold = ALARM_THRESHOLDS[tagId];
  if (!threshold) return "HEALTHY";
  
  // For digital tags, alarm triggers when value equals 1
  if (tagType === "DIGITAL_INPUT" || tagType === "DIGITAL_OUTPUT") {
    if (value === 1 || value === true) {
      return "Critical"; // Digital state changes are critical
    }
    return "HEALTHY";
  }
  
  // For analog tags, use threshold comparison
  if (value >= threshold.critical) return "CRITICAL";
  if (value >= threshold.moderate) return "MODERATE";
  return "HEALTHY";
}

function generateAlarmId() {
  return `ALM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

const ALARM_DESCRIPTION_TEMPLATES = {
  TEMPERATURE: {
    CRITICAL: (name, value, unit, threshold) =>
      `${name} temperature is critically high at ${value} ${unit}. Maximum limit is ${threshold.critical}. Immediate action required.`,
    MODERATE: (name, value, unit, threshold) =>
      `${name} temperature is above normal at ${value} ${unit}. Warning limit is ${threshold.moderate}. Monitor closely.`,
    HEALTHY: (name, value, unit) => 
      `${name} temperature is normal at ${value} ${unit}.`
  },

  PRESSURE: {
    CRITICAL: (name, value, unit, threshold) =>
      `${name} pressure has exceeded the critical limit at ${value} ${unit}. Safe limit is ${threshold.critical}. Immediate intervention required.`,
    MODERATE: (name, value, unit, threshold) =>
      `${name} pressure is approaching unsafe levels at ${value} ${unit}. Warning limit is ${threshold.moderate}.`,
    HEALTHY: (name, value, unit) =>
      `${name} pressure is within safe operating range at ${value} ${unit}.`
  },

  FLOW: {
    CRITICAL: (name, value, unit, threshold) =>
      `${name} flow rate is critically abnormal at ${value} ${unit}. Expected limit is ${threshold.critical}.`,
    MODERATE: (name, value, unit, threshold) =>
      `${name} flow rate is outside normal range at ${value} ${unit}.`,
    HEALTHY: (name, value, unit) =>
      `${name} flow rate is normal at ${value} ${unit}.`
  },

  DEFAULT: {
    CRITICAL: (name, value, unit) =>
      `${name} value is critically abnormal at ${value} ${unit}. Immediate attention required.`,
    MODERATE: (name, value, unit) =>
      `${name} value is outside normal range at ${value} ${unit}.`,
    HEALTHY: (name, value, unit) =>
      `${name} value is normal at ${value} ${unit}.`
  }
};

function getTagCategory(tagInfo) {
  const text = `${tagInfo?.description || ""}`.toLowerCase();

  if (text.includes("temp")) return "TEMPERATURE";
  if (text.includes("pressure")) return "PRESSURE";
  if (text.includes("flow")) return "FLOW";

  return "DEFAULT";
}

function createAlarmObject(tagId, value, alarmLevel, timestamp, tagType, tagInfo) {
  const threshold = ALARM_THRESHOLDS[tagId];
  
  // Get tag name and unit based on tag type
  let tagName = tagId;
  let unit = threshold?.unit || "";
  
  if (tagType === "DIGITAL_INPUT") {
    const info = DIGITAL_INPUT_TAGS.find(t => t.tagId === tagId);
    tagName = info?.description || tagId;
  } else if (tagType === "DIGITAL_OUTPUT") {
    const info = DIGITAL_OUTPUT_TAGS.find(t => t.tagId === tagId);
    tagName = info?.description || tagId;
  } else if (tagType === "ANALOG_INPUT") {
    const info = ANALOG_INPUT_TAGS.find(t => t.tagId === tagId);
    tagName = info?.description || tagId;
    unit = info?.unit || unit;
  } else if (tagType === "ANALOG_OUTPUT") {
    const info = ANALOG_OUTPUT_TAGS.find(t => t.tagId === tagId);
    tagName = info?.description || tagId;
    unit = info?.unit || unit;
  }

  let description = "";
  
  if (tagType === "DIGITAL_INPUT" || tagType === "DIGITAL_OUTPUT") {
    // Digital tag alarms
    const typeLabel = tagType === "DIGITAL_INPUT" ? "Digital Input" : "Digital Output";
    description = `${typeLabel} alarm triggered on ${tagName}. Current state: ${value === 1 || value === true ? "ON" : "OFF"}. Immediate attention required.`;
  } else {
    // Analog tag alarms
    const category = getTagCategory(tagInfo);
    const templates =
      ALARM_DESCRIPTION_TEMPLATES[category] ||
      ALARM_DESCRIPTION_TEMPLATES.DEFAULT;

    const descriptionBuilder =
      templates[alarmLevel] || ALARM_DESCRIPTION_TEMPLATES.DEFAULT[alarmLevel];

    description = descriptionBuilder(
      tagName,
      value,
      unit,
      threshold
    );
  }

  // Generate random acknowledgment time (30 seconds to 1 minute after trigger)
  const acknowledgedTime = new Date(timestamp.getTime() + Math.random() * 30000 + 30000);
  
  // Generate random resolved time (2-3 minutes after trigger)
  const resolvedTime = new Date(timestamp.getTime() + (120000 + Math.random() * 60000));

  return {
    id: generateAlarmId(),
    tag_id: tagId,
    tag_name: tagName,
    tag_type: tagType,
    priority: alarmLevel,
    description,
    triggered_value: `${value}${unit ? ' ' + unit : ''}`,
    triggered_at: timestamp.toISOString(),
    acknowledged_at: acknowledgedTime.toISOString(),
    resolved_at: resolvedTime.toISOString(),
    status: "RESOLVED"
  };
}

//============================================================================

const alarmTracker = new AlarmTracker();
let dataStreamCounter = 0;

app.get("/api/digital-inputs/tags", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      "SELECT * FROM digital_input_tags ORDER BY id"
    );
    connection.release();

    apiResponse(res, 200, "Digital input tags retrieved", rows);
  } catch (error) {
    handleError(res, error);
  }
});


// Data publishing function
async function publishSampleData() {
  try {
    const connection = await pool.getConnection();
    const timestamp = new Date();
    dataStreamCounter++;

    // Generate Digital Inputs with correlated values
    const digitalInputs = [];
    
    // Generate random base states
    const hasVoltageFault = generateRandomBoolean();
    const emergencyStopActive = generateRandomBoolean();
    const buzzerActive = generateRandomBoolean();
    const mixerTrip = generateRandomBoolean();
    const pumpTrip = generateRandomBoolean();
    const mixerRunning = !mixerTrip;
    const mixerHealthy = !mixerTrip;
    const pumpRunning = !pumpTrip;
    
    // DI-001: Voltage Protection (1 = fault/unhealthy, 0 = healthy)
    await connection.execute(
      "INSERT INTO digital_input_readings (tag_id, value, timestamp) VALUES (?, ?, ?)",
      ["DI-001", hasVoltageFault ? 1 : 0, timestamp]
    );
    digitalInputs.push({
      tagId: "DI-001",
      description: "Voltage Protection",
      value: hasVoltageFault,
    });

    // DI-002: Emergency Stop (1 = operated/active, 0 = not operated)
    await connection.execute(
      "INSERT INTO digital_input_readings (tag_id, value, timestamp) VALUES (?, ?, ?)",
      ["DI-002", emergencyStopActive ? 1 : 0, timestamp]
    );
    digitalInputs.push({
      tagId: "DI-002",
      description: "Emergency Stop",
      value: emergencyStopActive,
    });

    // DI-003: Buzzer Reset PB (1 = operated, 0 = unoperated)
    await connection.execute(
      "INSERT INTO digital_input_readings (tag_id, value, timestamp) VALUES (?, ?, ?)",
      ["DI-003", buzzerActive ? 1 : 0, timestamp]
    );
    digitalInputs.push({
      tagId: "DI-003",
      description: "Buzzer Reset PB",
      value: buzzerActive,
    });

    // DI-004: Mixer VFD Run (1 = running, 0 = not running)
    await connection.execute(
      "INSERT INTO digital_input_readings (tag_id, value, timestamp) VALUES (?, ?, ?)",
      ["DI-004", mixerRunning ? 1 : 0, timestamp]
    );
    digitalInputs.push({
      tagId: "DI-004",
      description: "Mixer VFD Run",
      value: mixerRunning,
    });

    // DI-005: Mixer VFD Trip(opposite of trip: 1 = running, 0 = not running)
    
    await connection.execute(
      "INSERT INTO digital_input_readings (tag_id, value, timestamp) VALUES (?, ?, ?)",
      ["DI-005", mixerRunning ? 1 : 0, timestamp]
    );
    digitalInputs.push({
      tagId: "DI-005",
      description: "Mixer VFD Trip",
      value: mixerRunning,
    });

    // DI-006: Mixer VFD Healthy (opposite of trip: 1 = healthy, 0 = unhealthy)
    await connection.execute(
      "INSERT INTO digital_input_readings (tag_id, value, timestamp) VALUES (?, ?, ?)",
      ["DI-006", mixerHealthy ? 1 : 0, timestamp]
    );
    digitalInputs.push({
      tagId: "DI-006",
      description: "Mixer VFD Healthy",
      value: mixerHealthy,
    });

    // DI-007: Circulation Pump Trip (1 = trip/fault, 0 = no trip)
    await connection.execute(
      "INSERT INTO digital_input_readings (tag_id, value, timestamp) VALUES (?, ?, ?)",
      ["DI-007", pumpTrip ? 1 : 0, timestamp]
    );
    digitalInputs.push({
      tagId: "DI-007",
      description: "Circulation Pump Trip",
      value: pumpTrip,
    });

    // DI-008: Circulation Pump Running (opposite of trip: 1 = running, 0 = not running)
    
    await connection.execute(
      "INSERT INTO digital_input_readings (tag_id, value, timestamp) VALUES (?, ?, ?)",
      ["DI-008", pumpRunning ? 1 : 0, timestamp]
    );
    digitalInputs.push({
      tagId: "DI-008",
      description: "Circulation Pump Running",
      value: pumpRunning,
    });


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

    // Check for alarms for all tag types
    const newAlarms = alarmTracker.checkAlarms(digitalInputs, digitalOutputs, analogInputs, analogOutputs, timestamp);

    // Store new alarms
    for (const alarm of newAlarms) {
      try {
        // Check if table structure exists, if not create simplified version
        await connection.execute(
          `INSERT INTO alarms (id, tag_id, tag_type, tag_name, priority, description, triggered_value, triggered_at, acknowledged_at, resolved_at, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            alarm.id,
            alarm.tag_id,
            alarm.tag_type,
            alarm.tag_name,
            alarm.priority,
            alarm.description,
            alarm.triggered_value,
            new Date(alarm.triggered_at).toISOString().slice(0, 19).replace('T', ' '),
            new Date(alarm.acknowledged_at).toISOString().slice(0, 19).replace('T', ' '),
            new Date(alarm.resolved_at).toISOString().slice(0, 19).replace('T', ' '),
            alarm.status,
            timestamp.toISOString().slice(0, 19).replace('T', ' ')
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

setInterval(publishSampleData, 30000);

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

