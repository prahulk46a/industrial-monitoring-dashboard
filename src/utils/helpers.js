const { ALARM_THRESHOLDS } = require("../config/constants");

const generateRandomBoolean = () => Math.random() > 0.5;

const generateRandomValue = (baseValue, volatility, minValue, maxValue) => {
  const variation = (Math.random() - 0.5) * 2 * volatility;
  const newValue = baseValue + variation;
  return parseFloat(
    Math.max(minValue, Math.min(maxValue, newValue)).toFixed(2)
  );
};

const getAlarmLevel = (tagId, value, tagType) => {
  const threshold = ALARM_THRESHOLDS[tagId];
  if (!threshold) return "HEALTHY";

  if (tagType === "DIGITAL_INPUT" || tagType === "DIGITAL_OUTPUT") {
    return value === 1 || value === true ? "CRITICAL" : "HEALTHY";
  }

  if (value >= threshold.critical) return "CRITICAL";
  if (value >= threshold.moderate) return "MODERATE";
  return "HEALTHY";
};

const generateAlarmId = () => {
  return `ALM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

module.exports = {
  generateRandomBoolean,
  generateRandomValue,
  getAlarmLevel,
  generateAlarmId,
};
