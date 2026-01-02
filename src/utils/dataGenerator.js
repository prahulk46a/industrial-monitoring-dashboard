const {
  DIGITAL_INPUT_TAGS,
  DIGITAL_OUTPUT_TAGS,
  ANALOG_INPUT_TAGS,
  ANALOG_OUTPUT_TAGS,
} = require("../config/constants");
const { generateRandomBoolean, generateRandomValue } = require("./helpers");

class DataGenerator {
  generateDigitalInputs() {
    const digitalInputs = [];
    const hasVoltageFault = generateRandomBoolean();
    const emergencyStopActive = generateRandomBoolean();
    const buzzerActive = generateRandomBoolean();
    const mixerTrip = generateRandomBoolean();
    const pumpTrip = generateRandomBoolean();

    digitalInputs.push({
      tagId: "DI-001",
      description: "Voltage Protection",
      value: hasVoltageFault ? 1 : 0,
    });
    digitalInputs.push({
      tagId: "DI-002",
      description: "Emergency Stop",
      value: emergencyStopActive ? 1 : 0,
    });
    digitalInputs.push({
      tagId: "DI-003",
      description: "Buzzer Reset PB",
      value: buzzerActive ? 1 : 0,
    });
    digitalInputs.push({
      tagId: "DI-004",
      description: "Mixer VFD Trip",
      value: mixerTrip ? 1 : 0,
    });

    const mixerRunning = !mixerTrip;
    digitalInputs.push({
      tagId: "DI-005",
      description: "Mixer VFD Running",
      value: mixerRunning ? 1 : 0,
    });

    const mixerHealthy = !mixerTrip;
    digitalInputs.push({
      tagId: "DI-006",
      description: "Mixer VFD Healthy",
      value: mixerHealthy ? 1 : 0,
    });

    digitalInputs.push({
      tagId: "DI-007",
      description: "Circulation Pump Trip",
      value: pumpTrip ? 1 : 0,
    });

    const pumpRunning = !pumpTrip;
    digitalInputs.push({
      tagId: "DI-008",
      description: "Circulation Pump Running",
      value: pumpRunning ? 1 : 0,
    });

    return digitalInputs;
  }

  generateDigitalOutputs() {
    const digitalOutputs = [];
    for (const tag of DIGITAL_OUTPUT_TAGS) {
      const value = generateRandomBoolean();
      digitalOutputs.push({
        tagId: tag.tagId,
        description: tag.description,
        value: value ? 1 : 0,
      });
    }
    return digitalOutputs;
  }

  generateAnalogInputs() {
    const analogInputs = [];
    for (const tag of ANALOG_INPUT_TAGS) {
      const value = generateRandomValue(
        tag.baseValue,
        tag.volatility,
        tag.minValue,
        tag.maxValue
      );
      const status =
        value > (tag.maxValue - tag.minValue) * 0.6 ? "MODERATE" : "HEALTHY";

      analogInputs.push({
        tagId: tag.tagId,
        description: tag.description,
        value: value,
        unit: tag.unit,
        status: status,
      });
    }
    return analogInputs;
  }

  generateAnalogOutputs() {
    const analogOutputs = [];
    for (const tag of ANALOG_OUTPUT_TAGS) {
      const value = generateRandomValue(
        tag.baseValue,
        tag.volatility,
        tag.minValue,
        tag.maxValue
      );
      analogOutputs.push({
        tagId: tag.tagId,
        description: tag.description,
        value: value,
        unit: tag.unit,
      });
    }
    return analogOutputs;
  }
}

module.exports = new DataGenerator();
