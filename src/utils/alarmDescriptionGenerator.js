const {
  ALARM_THRESHOLDS,
  DIGITAL_INPUT_TAGS,
  DIGITAL_OUTPUT_TAGS,
  ANALOG_INPUT_TAGS,
  ANALOG_OUTPUT_TAGS,
} = require("../config/constants");

const ALARM_DESCRIPTION_TEMPLATES = {
  TEMPERATURE: {
    CRITICAL: (name, value, unit, threshold) =>
      `${name} temperature is critically high at ${value} ${unit}. Maximum limit is ${threshold.critical}. Immediate action required.`,
    MODERATE: (name, value, unit, threshold) =>
      `${name} temperature is above normal at ${value} ${unit}. Warning limit is ${threshold.moderate}. Monitor closely.`,
    HEALTHY: (name, value, unit) =>
      `${name} temperature is normal at ${value} ${unit}.`,
  },
  PRESSURE: {
    CRITICAL: (name, value, unit, threshold) =>
      `${name} pressure has exceeded the critical limit at ${value} ${unit}. Safe limit is ${threshold.critical}. Immediate intervention required.`,
    MODERATE: (name, value, unit, threshold) =>
      `${name} pressure is approaching unsafe levels at ${value} ${unit}. Warning limit is ${threshold.moderate}.`,
    HEALTHY: (name, value, unit) =>
      `${name} pressure is within safe operating range at ${value} ${unit}.`,
  },
  DEFAULT: {
    CRITICAL: (name, value, unit) =>
      `${name} value is critically abnormal at ${value} ${unit}. Immediate attention required.`,
    MODERATE: (name, value, unit) =>
      `${name} value is outside normal range at ${value} ${unit}.`,
    HEALTHY: (name, value, unit) =>
      `${name} value is normal at ${value} ${unit}.`,
  },
};

const getTagCategory = (tagInfo) => {
  const text = `${tagInfo?.description || ""}`.toLowerCase();
  if (text.includes("temp")) return "TEMPERATURE";
  if (text.includes("pressure")) return "PRESSURE";
  return "DEFAULT";
};

const getTagName = (tagId, tagType) => {
  let tags = [];
  switch (tagType) {
    case "DIGITAL_INPUT":
      tags = DIGITAL_INPUT_TAGS;
      break;
    case "DIGITAL_OUTPUT":
      tags = DIGITAL_OUTPUT_TAGS;
      break;
    case "ANALOG_INPUT":
      tags = ANALOG_INPUT_TAGS;
      break;
    case "ANALOG_OUTPUT":
      tags = ANALOG_OUTPUT_TAGS;
      break;
  }
  const tag = tags.find((t) => t.tagId === tagId);
  return tag?.description || tagId;
};

const generateAlarmDescription = (
  tagId,
  value,
  alarmLevel,
  tagType,
  tagInfo
) => {
  const threshold = ALARM_THRESHOLDS[tagId];
  const unit = threshold?.unit || "";
  const tagName = getTagName(tagId, tagType);

  if (tagType === "DIGITAL_INPUT" || tagType === "DIGITAL_OUTPUT") {
    const typeLabel =
      tagType === "DIGITAL_INPUT" ? "Digital Input" : "Digital Output";
    return `${typeLabel} alarm triggered on ${tagName}. Current state: ${
      value === 1 || value === true ? "ON" : "OFF"
    }. Immediate attention required.`;
  }

  const category = getTagCategory(tagInfo);
  const templates =
    ALARM_DESCRIPTION_TEMPLATES[category] ||
    ALARM_DESCRIPTION_TEMPLATES.DEFAULT;
  const descriptionBuilder =
    templates[alarmLevel] || ALARM_DESCRIPTION_TEMPLATES.DEFAULT[alarmLevel];

  return descriptionBuilder(tagName, value, unit, threshold);
};

module.exports = {
  generateAlarmDescription,
  getTagCategory,
  getTagName,
  ALARM_DESCRIPTION_TEMPLATES,
};
