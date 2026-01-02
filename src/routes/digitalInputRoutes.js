const express = require("express");
const pool = require("../config/database");
const { apiResponse } = require("../middleware/responseHandler");

const router = express.Router();

// GET digital input readings (latest)
router.get("/readings", async (req, res, next) => {
  try {
    const { limit = 8 } = req.query;
    const connection = await pool.getConnection();

    const query = `
      SELECT dir.*, dit.description 
      FROM digital_input_readings dir
      JOIN digital_input_tags dit ON dir.tag_id = dit.tag_id
      ORDER BY dir.id DESC LIMIT ?
    `;

    const [rows] = await connection.execute(query, [parseInt(limit)]);
    connection.release();

    apiResponse(res, 200, "Digital input readings retrieved", rows.reverse());
  } catch (error) {
    next(error);
  }
});

// GET all digital input tags
router.get("/tags", async (req, res, next) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      "SELECT * FROM digital_input_tags ORDER BY id"
    );
    connection.release();

    apiResponse(res, 200, "Digital input tags retrieved", rows);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
