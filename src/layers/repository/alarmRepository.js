const pool = require("../../config/database");

class AlarmRepository {
  async getAllAlarms(filters) {
    let { status, priority } = filters || {};
    // Coerce numeric values and guard against injection by forcing integers
    let limit = parseInt(filters?.limit, 10);
    let offset = parseInt(filters?.offset, 10);
    if (!Number.isFinite(limit) || limit <= 0) limit = 10;
    if (!Number.isFinite(offset) || offset < 0) offset = 0;

    let query = "SELECT * FROM alarms WHERE 1=1";
    const params = [];

    if (status) {
      query += " AND status = ?";
      params.push(status);
    }
    if (priority) {
      query += " AND priority = ?";
      params.push(priority);
    }

    // Inline numeric pagination values safely (they are validated integers above)
    query += ` ORDER BY triggered_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const connection = await pool.getConnection();
    const [rows] = await connection.execute(query, params);
    connection.release();

    return rows;
  }

  async getAlarmById(alarmId) {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      "SELECT * FROM alarms WHERE id = ?",
      [alarmId]
    );
    connection.release();
    return rows[0] || null;
  }

  async createAlarm(alarmData) {
    const connection = await pool.getConnection();
    const {
      id,
      tag_id,
      tag_type,
      priority,
      description,
      triggered_value,
      triggered_at,
      acknowledged_at,
      resolved_at,
      status,
    } = alarmData;

    await connection.execute(
      `INSERT INTO alarms (id, tag_id, tag_type, priority, description, triggered_value, triggered_at, acknowledged_at, resolved_at, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        tag_id,
        tag_type,
        priority,
        description,
        triggered_value,
        triggered_at,
        acknowledged_at,
        resolved_at,
        status,
        new Date(),
      ]
    );
    connection.release();
  }

  async acknowledgeAlarm(alarmId) {
    const connection = await pool.getConnection();
    await connection.execute(
      "UPDATE alarms SET acknowledged_at = NOW() WHERE id = ?",
      [alarmId]
    );
    connection.release();
  }

  async resolveAlarm(alarmId) {
    const connection = await pool.getConnection();
    await connection.execute(
      "UPDATE alarms SET status = ?, resolved_at = NOW() WHERE id = ?",
      ["RESOLVED", alarmId]
    );
    connection.release();
  }

  async getAlarmsByTag(tagId, filters) {
    let { status, priority } = filters || {};
    let limit = parseInt(filters?.limit, 10);
    let offset = parseInt(filters?.offset, 10);
    let days = parseInt(filters?.days, 10);

    if (!Number.isFinite(limit) || limit <= 0) limit = 50;
    if (!Number.isFinite(offset) || offset < 0) offset = 0;
    if (!Number.isFinite(days) || days <= 0) days = 30;

    // Inline days and pagination after sanitizing
    let query = `SELECT * FROM alarms WHERE tag_id = ? AND triggered_at >= DATE_SUB(NOW(), INTERVAL ${days} DAY)`;
    const params = [tagId];

    if (status) {
      query += " AND status = ?";
      params.push(status);
    }
    if (priority) {
      query += " AND priority = ?";
      params.push(priority);
    }

    query += ` ORDER BY triggered_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const connection = await pool.getConnection();
    const [rows] = await connection.execute(query, params);
    connection.release();

    return rows;
  }

  async getAlarmStats(filters = {}) {
    let { days = 30, tagId = null, priority = null, status = null } = filters;
    days = parseInt(days, 10);
    if (!Number.isFinite(days) || days <= 0) days = 30;

    let query = `SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active,
      SUM(CASE WHEN status = 'RESOLVED' THEN 1 ELSE 0 END) as resolved,
      SUM(CASE WHEN priority = 'CRITICAL' THEN 1 ELSE 0 END) as critical,
      SUM(CASE WHEN priority = 'MODERATE' THEN 1 ELSE 0 END) as moderate
      FROM alarms WHERE triggered_at >= DATE_SUB(NOW(), INTERVAL ${days} DAY)`;

    const params = [];

    if (tagId) {
      query += " AND tag_id = ?";
      params.push(tagId);
    }
    if (priority) {
      query += " AND priority = ?";
      params.push(priority);
    }
    if (status) {
      query += " AND status = ?";
      params.push(status);
    }

    const connection = await pool.getConnection();
    const [rows] = await connection.execute(query, params);
    connection.release();

    return rows[0];
  }
}

module.exports = new AlarmRepository();
