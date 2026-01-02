const { generateAlarmId, getAlarmLevel } = require("./helpers");
const { generateAlarmDescription } = require("./alarmDescriptionGenerator");

class AlarmTracker {
  constructor() {
    this.activeAlarms = new Map();
    this.alarmHistory = [];
    this.totalAlarms = 0;
    this.totalResolved = 0;
  }

  checkAlarms(
    digitalInputs,
    digitalOutputs,
    analogInputs,
    analogOutputs,
    timestamp
  ) {
    const newAlarms = [];

    for (const input of digitalInputs) {
      const alarm = this.checkTagForAlarm(input, "DIGITAL_INPUT", timestamp);
      if (alarm) newAlarms.push(alarm);
    }

    for (const output of digitalOutputs) {
      const alarm = this.checkTagForAlarm(output, "DIGITAL_OUTPUT", timestamp);
      if (alarm) newAlarms.push(alarm);
    }

    for (const input of analogInputs) {
      const alarm = this.checkTagForAlarm(input, "ANALOG_INPUT", timestamp);
      if (alarm) newAlarms.push(alarm);
    }

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
      if (!existingAlarm || existingAlarm.priority !== currentLevel) {
        const alarm = this.createAlarmObject(
          tagId,
          value,
          currentLevel,
          timestamp,
          tagType,
          tag
        );
        this.activeAlarms.set(tagId, alarm);
        this.totalAlarms++;
        return alarm;
      } else {
        existingAlarm.triggered_value = value;
        existingAlarm.triggered_at = timestamp.toISOString();
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

  createAlarmObject(tagId, value, alarmLevel, timestamp, tagType, tagInfo) {
    const description = generateAlarmDescription(
      tagId,
      value,
      alarmLevel,
      tagType,
      tagInfo
    );
    const acknowledgedTime = new Date(
      timestamp.getTime() + Math.random() * 30000 + 30000
    );
    const resolvedTime = new Date(
      timestamp.getTime() + (120000 + Math.random() * 60000)
    );

    return {
      id: generateAlarmId(),
      tag_id: tagId,
      tag_type: tagType,
      priority: alarmLevel,
      description,
      triggered_value: `${value}`,
      triggered_at: timestamp.toISOString(),
      acknowledged_at: acknowledgedTime.toISOString(),
      resolved_at: resolvedTime.toISOString(),
      status: "RESOLVED",
    };
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
      criticalCount: activeAlarms.filter((a) => a.priority === "CRITICAL")
        .length,
      warningCount: activeAlarms.filter((a) => a.priority === "MODERATE")
        .length,
    };
  }
}

module.exports = AlarmTracker;
