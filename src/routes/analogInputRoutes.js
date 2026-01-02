const express = require("express");
const pool = require("../config/database");
const { apiResponse } = require("../middleware/responseHandler");

const router = express.Router();

// GET analog input readings
router.get("/readings", async (req, res, next) => {
  try {
    const { tagId, tag_id, status } = req.query;
    const limit = Number(req.query.limit) || 10;
    const filterTagId = tagId || tag_id;

    const connection = await pool.getConnection();

    let query = `
      SELECT air.*, ait.description, ait.unit
      FROM analog_input_readings air
      JOIN analog_input_tags ait ON air.tag_id = ait.tag_id
    `;

    const params = [];
    const conditions = [];

    if (filterTagId) {
      conditions.push(`air.tag_id = ?`);
      params.push(filterTagId);
    }

    if (status) {
      conditions.push(`air.status = ?`);
      params.push(status);
    }

    if (conditions.length) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += ` ORDER BY air.id DESC LIMIT ${limit}`;

    const [rows] = await connection.execute(query, params);
    connection.release();

    apiResponse(res, 200, "Analog input readings retrieved", rows.reverse());
  } catch (error) {
    next(error);
  }
});

// GET all analog input tags
router.get("/tags", async (req, res, next) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      "SELECT * FROM analog_input_tags ORDER BY id"
    );
    connection.release();

    apiResponse(res, 200, "Analog input tags retrieved", rows);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
