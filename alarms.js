
// GET alarm frequency by type/priority
app.get("/api/alarms/frequency/by-type", async (req, res) => {
  let connection;
  try {
    const { days = 7 } = req.query;

    connection = await pool.getConnection();

    // Get alarm frequency by priority
    const [frequencyByPriority] = await connection.execute(`
      SELECT 
        priority,
        COUNT(*) as count,
        ROUND((COUNT(*) / (SELECT COUNT(*) FROM alarms WHERE triggered_at >= DATE_SUB(NOW(), INTERVAL ? DAY)) * 100), 2) as percentage
      FROM alarms
      WHERE triggered_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY priority
      ORDER BY 
        CASE 
          WHEN priority = 'CRITICAL' THEN 1
          WHEN priority = 'MODERATE' THEN 2
          ELSE 3
        END
    `, [parseInt(days), parseInt(days)]);

    // Get alarm frequency by tag
    const [frequencyByTag] = await connection.execute(`
      SELECT 
        tag_id,
        (SELECT description FROM analog_input_tags WHERE tag_id = a.tag_id LIMIT 1) as description,
        priority,
        COUNT(*) as count,
        DATE(triggered_at) as date
      FROM alarms a
      WHERE triggered_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY tag_id, priority, DATE(triggered_at)
      ORDER BY tag_id, date DESC, count DESC
    `, [parseInt(days)]);

    // Get alarm frequency trend (daily)
    const [frequencyTrend] = await connection.execute(`
      SELECT 
        DATE(triggered_at) as date,
        priority,
        COUNT(*) as count
      FROM alarms
      WHERE triggered_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(triggered_at), priority
      ORDER BY date DESC, 
        CASE 
          WHEN priority = 'CRITICAL' THEN 1
          WHEN priority = 'MODERATE' THEN 2
          ELSE 3
        END
    `, [parseInt(days)]);

    // Get alarm statistics summary
    const [alarmStats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_alarms,
        SUM(CASE WHEN priority = 'CRITICAL' THEN 1 ELSE 0 END) as critical_count,
        SUM(CASE WHEN priority = 'MODERATE' THEN 1 ELSE 0 END) as moderate_count,
        SUM(CASE WHEN priority = 'HEALTHY' THEN 1 ELSE 0 END) as healthy_count,
        SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active_count,
        SUM(CASE WHEN status = 'RESOLVED' THEN 1 ELSE 0 END) as resolved_count,
        ROUND(AVG(TIMESTAMPDIFF(SECOND, triggered_at, resolved_at)) / 60, 2) as avg_resolution_time_minutes,
        ROUND(AVG(TIMESTAMPDIFF(SECOND, triggered_at, acknowledged_at)) / 60, 2) as avg_acknowledgement_time_minutes,
        MIN(TIMESTAMPDIFF(SECOND, triggered_at, resolved_at)) / 60 as min_resolution_time_minutes,
        MAX(TIMESTAMPDIFF(SECOND, triggered_at, resolved_at)) / 60 as max_resolution_time_minutes
      FROM alarms
      WHERE triggered_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [parseInt(days)]);

    connection.release();

    apiResponse(res, 200, "Alarm frequency data retrieved", {
      period: { days: parseInt(days) },
      summary: {
        totalAlarms: alarmStats[0]?.total_alarms || 0,
        activeCount: alarmStats[0]?.active_count || 0,
        resolvedCount: alarmStats[0]?.resolved_count || 0,
        bySeverity: {
          critical: alarmStats[0]?.critical_count || 0,
          moderate: alarmStats[0]?.moderate_count || 0,
          healthy: alarmStats[0]?.healthy_count || 0
        },
        responseMetrics: {
          avgResolutionTimeMinutes: parseFloat(alarmStats[0]?.avg_resolution_time_minutes) || 0,
          avgAcknowledgementTimeMinutes: parseFloat(alarmStats[0]?.avg_acknowledgement_time_minutes) || 0,
          minResolutionTimeMinutes: parseFloat(alarmStats[0]?.min_resolution_time_minutes) || 0,
          maxResolutionTimeMinutes: parseFloat(alarmStats[0]?.max_resolution_time_minutes) || 0
        }
      },
      frequencyByPriority: frequencyByPriority,
      frequencyByTag: frequencyByTag,
      frequencyTrend: frequencyTrend
    });
  } catch (error) {
    handleError(res, error);
  } finally {
    if (connection) connection.release();
  }
});