// Alarm Thresholds
const ALARM_THRESHOLDS = {
  "DI-001": { moderate: 1, critical: 1, unit: "" },
  "DI-002": { moderate: 1, critical: 1, unit: "" },
  "DI-003": { moderate: 1, critical: 1, unit: "" },
  "DI-004": { moderate: 1, critical: 1, unit: "" },
  "DI-005": { moderate: 1, critical: 1, unit: "" },
  "DI-006": { moderate: 1, critical: 1, unit: "" },
  "DI-007": { moderate: 1, critical: 1, unit: "" },
  "DI-008": { moderate: 1, critical: 1, unit: "" },
  "DO-001": { moderate: 1, critical: 1, unit: "" },
  "DO-002": { moderate: 1, critical: 1, unit: "" },
  "DO-003": { moderate: 1, critical: 1, unit: "" },
  "DO-004": { moderate: 1, critical: 1, unit: "" },
  "AI-001": { moderate: 5, critical: 8, unit: "bar" },
  "AI-002": { moderate: 50, critical: 75, unit: "°C" },
  "AI-003": { moderate: 50, critical: 75, unit: "°C" },
  "AI-004": { moderate: 30, critical: 50, unit: "%" },
  "AI-005": { moderate: 25, critical: 40, unit: "kg" },
  "AI-006": { moderate: 7, critical: 9, unit: "pH" },
  "AI-007": { moderate: 750, critical: 1200, unit: "RPM" },
  "AO-001": { moderate: 70, critical: 90, unit: "%" },
};

// Alarm Levels
const ALARM_LEVELS = {
  CRITICAL: { priority: 1, color: "RED" },
  MODERATE: { priority: 2, color: "YELLOW" },
  HEALTHY: { priority: 3, color: "GREEN" },
};

// Digital Input Tags
const DIGITAL_INPUT_TAGS = [
  { id: 1, tagId: "DI-001", description: "Voltage Protection" },
  { id: 2, tagId: "DI-002", description: "Emergency Stop" },
  { id: 3, tagId: "DI-003", description: "Buzzer Reset PB" },
  { id: 4, tagId: "DI-004", description: "Mixer VFD Trip" },
  { id: 5, tagId: "DI-005", description: "Mixer VFD Running" },
  { id: 6, tagId: "DI-006", description: "Mixer VFD Healthy" },
  { id: 7, tagId: "DI-007", description: "Circulation Pump Trip" },
  { id: 8, tagId: "DI-008", description: "Circulation Pump Running" },
];

// Digital Output Tags
const DIGITAL_OUTPUT_TAGS = [
  { id: 1, tagId: "DO-001", description: "Buzzer" },
  { id: 2, tagId: "DO-002", description: "Emergency" },
  { id: 3, tagId: "DO-003", description: "CIP Valve-1" },
  { id: 4, tagId: "DO-004", description: "SIP Valve-1" },
];

// Analog Input Tags
const ANALOG_INPUT_TAGS = [
  {
    tagId: "AI-001",
    description: "Line 1 - Pressure",
    unit: "bar",
    baseValue: 5,
    volatility: 4,
    minValue: 0,
    maxValue: 10,
  },
  {
    tagId: "AI-002",
    description: "Line 1 - Temperature",
    unit: "°C",
    baseValue: 50,
    volatility: 30,
    minValue: 0,
    maxValue: 100,
  },
  {
    tagId: "AI-003",
    description: "Line 2 - Temperature",
    unit: "°C",
    baseValue: 48,
    volatility: 20,
    minValue: 0,
    maxValue: 100,
  },
  {
    tagId: "AI-004",
    description: "DO Transmitter",
    unit: "%",
    baseValue: 45,
    volatility: 12,
    minValue: 0,
    maxValue: 100,
  },
  {
    tagId: "AI-005",
    description: "Load Cell",
    unit: "kg",
    baseValue: 25,
    volatility: 3,
    minValue: 0,
    maxValue: 50,
  },
  {
    tagId: "AI-006",
    description: "Cond PH Sensor",
    unit: "pH",
    baseValue: 7,
    volatility: 0.8,
    minValue: 0,
    maxValue: 14,
  },
  {
    tagId: "AI-007",
    description: "Magnetic Mixer",
    unit: "RPM",
    baseValue: 1100,
    volatility: 80,
    minValue: 0,
    maxValue: 1500,
  },
];

// Analog Output Tags
const ANALOG_OUTPUT_TAGS = [
  {
    tagId: "AO-001",
    description: "Control Valve",
    unit: "%",
    baseValue: 50,
    volatility: 15,
    minValue: 0,
    maxValue: 100,
  },
];

module.exports = {
  ALARM_THRESHOLDS,
  ALARM_LEVELS,
  DIGITAL_INPUT_TAGS,
  DIGITAL_OUTPUT_TAGS,
  ANALOG_INPUT_TAGS,
  ANALOG_OUTPUT_TAGS,
};
