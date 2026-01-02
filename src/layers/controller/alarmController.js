const { apiResponse } = require("../../middleware/responseHandler");
const alarmService = require("../service/alarmService");

class AlarmController {
  async getAllAlarms(req, res, next) {
    try {
      const { status = "ACTIVE", priority, limit = 10, offset = 0 } = req.query;
      const alarms = await alarmService.getAllAlarms({
        status,
        priority,
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      apiResponse(res, 200, "Alarms retrieved", {
        limit: parseInt(limit),
        offset: parseInt(offset),
        alarms,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAlarmById(req, res, next) {
    try {
      const { alarmId } = req.params;
      const alarm = await alarmService.getAlarmById(alarmId);
      apiResponse(res, 200, "Alarm retrieved", alarm);
    } catch (error) {
      next(error);
    }
  }

  async acknowledgeAlarm(req, res, next) {
    try {
      const { alarmId } = req.params;
      const result = await alarmService.acknowledgeAlarm(alarmId);
      apiResponse(res, 200, result.message);
    } catch (error) {
      next(error);
    }
  }

  async resolveAlarm(req, res, next) {
    try {
      const { alarmId } = req.params;
      const result = await alarmService.resolveAlarm(alarmId);
      apiResponse(res, 200, result.message);
    } catch (error) {
      next(error);
    }
  }

  async getAlarmsByTag(req, res, next) {
    try {
      const { tagId } = req.params;
      const { status, priority, limit = 50, offset = 0, days = 30 } = req.query;
      const alarms = await alarmService.getAlarmsByTag(tagId, {
        status,
        priority,
        limit: parseInt(limit),
        offset: parseInt(offset),
        days: parseInt(days),
      });

      apiResponse(res, 200, `Alarms retrieved by tag: ${tagId}`, {
        tagId,
        pagination: { limit: parseInt(limit), offset: parseInt(offset) },
        alarms,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAlarmStats(req, res, next) {
    try {
      const {
        days = 30,
        tagId = null,
        priority = null,
        status = null,
      } = req.query;
      const stats = await alarmService.getAlarmStats({
        days: parseInt(days),
        tagId,
        priority,
        status,
      });

      apiResponse(res, 200, "Alarm statistics retrieved", {
        total: stats?.total || 0,
        active: stats?.active || 0,
        resolved: stats?.resolved || 0,
        bySeverity: {
          critical: stats?.critical || 0,
          moderate: stats?.moderate || 0,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AlarmController();
