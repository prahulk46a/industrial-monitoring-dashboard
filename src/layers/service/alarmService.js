const alarmRepository = require("../repository/alarmRepository");

class AlarmService {
  async getAllAlarms(filters) {
    return await alarmRepository.getAllAlarms(filters);
  }

  async getAlarmById(alarmId) {
    const alarm = await alarmRepository.getAlarmById(alarmId);
    if (!alarm) {
      throw { statusCode: 404, message: "Alarm not found" };
    }
    return alarm;
  }

  async createAlarm(alarmData) {
    try {
      await alarmRepository.createAlarm(alarmData);
      return alarmData;
    } catch (error) {
      console.error("Error creating alarm:", error.message);
      throw error;
    }
  }

  async acknowledgeAlarm(alarmId) {
    await this.getAlarmById(alarmId); // Validate alarm exists
    await alarmRepository.acknowledgeAlarm(alarmId);
    return { message: "Alarm acknowledged successfully" };
  }

  async resolveAlarm(alarmId) {
    await this.getAlarmById(alarmId); // Validate alarm exists
    await alarmRepository.resolveAlarm(alarmId);
    return { message: "Alarm resolved successfully" };
  }

  async getAlarmsByTag(tagId, filters) {
    return await alarmRepository.getAlarmsByTag(tagId, filters);
  }

  async getAlarmStats(filters = {}) {
    return await alarmRepository.getAlarmStats(filters);
  }
}

module.exports = new AlarmService();
