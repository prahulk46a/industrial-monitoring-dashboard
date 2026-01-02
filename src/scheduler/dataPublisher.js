const pool = require("../config/database");
const {
  DIGITAL_INPUT_TAGS,
  DIGITAL_OUTPUT_TAGS,
  ANALOG_INPUT_TAGS,
  ANALOG_OUTPUT_TAGS,
} = require("../config/constants");
const dataGenerator = require("../utils/dataGenerator");
const AlarmTracker = require("../utils/alarmTracker");
const alarmService = require("../layers/service/alarmService");

class DataPublisher {
  constructor() {
    this.alarmTracker = new AlarmTracker();
    this.dataStreamCounter = 0;
  }

  async publishSampleData() {
    try {
      const connection = await pool.getConnection();
      const timestamp = new Date();
      this.dataStreamCounter++;

      // Generate all readings
      const digitalInputs = dataGenerator.generateDigitalInputs();
      const digitalOutputs = dataGenerator.generateDigitalOutputs();
      const analogInputs = dataGenerator.generateAnalogInputs();
      const analogOutputs = dataGenerator.generateAnalogOutputs();

      // Insert digital input readings
      for (const input of digitalInputs) {
        await connection.execute(
          "INSERT INTO digital_input_readings (tag_id, value, timestamp) VALUES (?, ?, ?)",
          [input.tagId, input.value, timestamp]
        );
      }

      // Insert digital output readings
      for (const output of digitalOutputs) {
        await connection.execute(
          "INSERT INTO digital_output_readings (tag_id, value, timestamp) VALUES (?, ?, ?)",
          [output.tagId, output.value, timestamp]
        );
      }

      // Insert analog input readings
      for (const input of analogInputs) {
        await connection.execute(
          "INSERT INTO analog_input_readings (tag_id, value, status, timestamp) VALUES (?, ?, ?, ?)",
          [input.tagId, input.value, input.status, timestamp]
        );
      }

      // Insert analog output readings
      for (const output of analogOutputs) {
        await connection.execute(
          "INSERT INTO analog_output_readings (tag_id, value, timestamp) VALUES (?, ?, ?)",
          [output.tagId, output.value, timestamp]
        );
      }

      // Check for alarms
      const newAlarms = this.alarmTracker.checkAlarms(
        digitalInputs,
        digitalOutputs,
        analogInputs,
        analogOutputs,
        timestamp
      );

      // Store new alarms in database
      for (const alarm of newAlarms) {
        try {
          await alarmService.createAlarm(alarm);
          console.log(`🚨 ALARM: ${alarm.description}`);
        } catch (dbError) {
          console.log(`⚠️ Alarm insert note: ${dbError.message}`);
        }
      }

      connection.release();

      const stats = this.alarmTracker.getAlarmStatistics();
      console.log(
        `\n📊 Data Stream #${
          this.dataStreamCounter
        } published at ${timestamp.toLocaleTimeString()}`
      );
      console.log(
        `   Digital Inputs: ${digitalInputs.length} | Digital Outputs: ${digitalOutputs.length}`
      );
      console.log(
        `   Analog Inputs: ${analogInputs.length} | Analog Outputs: ${analogOutputs.length}`
      );
      console.log(
        `   Active Alarms: ${stats.activeAlarmCount} (Critical: ${stats.criticalCount}, Warning: ${stats.warningCount})\n`
      );
    } catch (error) {
      console.error("❌ Error publishing data:", error);
    }
  }

  async initializeDatabase() {
    try {
      const connection = await pool.getConnection();
      console.log("📊 Initializing database...\n");

      // Insert Digital Input Tags
      for (const tag of DIGITAL_INPUT_TAGS) {
        await connection.execute(
          `INSERT INTO digital_input_tags (id, tag_id, description) 
           VALUES (?, ?, ?) 
           ON DUPLICATE KEY UPDATE description=VALUES(description)`,
          [tag.id, tag.tagId, tag.description]
        );
      }
      console.log(
        `✅ ${DIGITAL_INPUT_TAGS.length} Digital Input tags initialized`
      );

      // Insert Digital Output Tags
      for (const tag of DIGITAL_OUTPUT_TAGS) {
        await connection.execute(
          `INSERT INTO digital_output_tags (id, tag_id, description) 
           VALUES (?, ?, ?) 
           ON DUPLICATE KEY UPDATE description=VALUES(description)`,
          [tag.id, tag.tagId, tag.description]
        );
      }
      console.log(
        `✅ ${DIGITAL_OUTPUT_TAGS.length} Digital Output tags initialized`
      );

      // Insert Analog Input Tags
      for (const tag of ANALOG_INPUT_TAGS) {
        await connection.execute(
          `INSERT INTO analog_input_tags (id, tag_id, description, unit, min_value, max_value, base_value, volatility) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?) 
           ON DUPLICATE KEY UPDATE description=VALUES(description)`,
          [
            ANALOG_INPUT_TAGS.indexOf(tag) + 1,
            tag.tagId,
            tag.description,
            tag.unit,
            tag.minValue,
            tag.maxValue,
            tag.baseValue,
            tag.volatility,
          ]
        );
      }
      console.log(
        `✅ ${ANALOG_INPUT_TAGS.length} Analog Input tags initialized`
      );

      // Insert Analog Output Tags
      for (const tag of ANALOG_OUTPUT_TAGS) {
        await connection.execute(
          `INSERT INTO analog_output_tags (id, tag_id, description, unit, min_value, max_value, base_value, volatility) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?) 
           ON DUPLICATE KEY UPDATE description=VALUES(description)`,
          [
            ANALOG_OUTPUT_TAGS.indexOf(tag) + 1,
            tag.tagId,
            tag.description,
            tag.unit,
            tag.minValue,
            tag.maxValue,
            tag.baseValue,
            tag.volatility,
          ]
        );
      }
      console.log(
        `✅ ${ANALOG_OUTPUT_TAGS.length} Analog Output tags initialized\n`
      );

      connection.release();
    } catch (error) {
      console.error("❌ Database initialization error:", error.message);
    }
  }

  startScheduler(interval = 30000) {
    setInterval(() => this.publishSampleData(), interval);
  }
}

module.exports = new DataPublisher();
