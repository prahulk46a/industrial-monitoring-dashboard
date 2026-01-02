const express = require("express");
const pool = require("../config/database");
const { apiResponse } = require("../middleware/responseHandler");

const router = express.Router();

// GET analog output readings
router.get("/readings", async (req, res, next) => {
  try {
    const { tagId, tag_id, status } = req.query;
    const limit = Number(req.query.limit) || 1;
    const filterTagId = tagId || tag_id;

    const connection = await pool.getConnection();

    let query = `
      SELECT aor.*, aot.description, aot.unit
      FROM analog_output_readings aor
      JOIN analog_output_tags aot ON aor.tag_id = aot.tag_id
    `;

    const params = [];
    const conditions = [];

    if (filterTagId) {
      conditions.push(`aor.tag_id = ?`);
      params.push(filterTagId);
    }

    if (status) {
      conditions.push(`aor.status = ?`);
      params.push(status);
    }

    if (conditions.length) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += ` ORDER BY aor.id DESC LIMIT ${limit}`;

    const [rows] = await connection.execute(query, params);
    connection.release();

    apiResponse(res, 200, "Analog output readings retrieved", rows.reverse());
  } catch (error) {
    next(error);
  }
});

// GET all analog output tags
router.get("/tags", async (req, res, next) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      "SELECT * FROM analog_output_tags ORDER BY id"
    );
    connection.release();

    apiResponse(res, 200, "Analog output tags retrieved", rows);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
