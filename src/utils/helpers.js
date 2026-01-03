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

// Format date for MySQL DATETIME column (YYYY-MM-DD HH:MM:SS)
const formatDateForMySQL = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

module.exports = {
  generateRandomBoolean,
  generateRandomValue,
  getAlarmLevel,
  generateAlarmId,
  formatDateForMySQL,
};
