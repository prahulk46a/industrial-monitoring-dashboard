const express = require("express");
const alarmController = require("../layers/controller/alarmController");

const router = express.Router();

// GET all alarms with filters
router.get("/", async (req, res, next) => {
  await alarmController.getAllAlarms(req, res, next);
});

// GET specific alarm by ID
router.get("/:alarmId", async (req, res, next) => {
  await alarmController.getAlarmById(req, res, next);
});

// GET alarms by tag
router.get("/by-tag/:tagId", async (req, res, next) => {
  await alarmController.getAlarmsByTag(req, res, next);
});

// GET alarm statistics
router.get("/stats/summary", async (req, res, next) => {
  await alarmController.getAlarmStats(req, res, next);
});

// ACKNOWLEDGE an alarm
router.post("/:alarmId/acknowledge", async (req, res, next) => {
  await alarmController.acknowledgeAlarm(req, res, next);
});

// RESOLVE an alarm
router.post("/:alarmId/resolve", async (req, res, next) => {
  await alarmController.resolveAlarm(req, res, next);
});

module.exports = router;
