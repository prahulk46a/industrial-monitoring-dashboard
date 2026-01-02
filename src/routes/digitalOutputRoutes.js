const express = require("express");
const pool = require("../config/database");
const { apiResponse } = require("../middleware/responseHandler");

const router = express.Router();

// GET digital output readings
router.get("/readings", async (req, res, next) => {
  try {
    const { tagId } = req.query;
    const limit = Number(req.query.limit) || 4;

    const connection = await pool.getConnection();

    let query = `
      SELECT dor.*, dot.description
      FROM digital_output_readings dor
      JOIN digital_output_tags dot ON dor.tag_id = dot.tag_id
    `;

    const params = [];

    if (tagId) {
      query += ` WHERE dor.tag_id = ?`;
      params.push(tagId);
    }

    query += ` ORDER BY dor.id DESC LIMIT ${limit}`;

    const [rows] = await connection.execute(query, params);
    connection.release();

    apiResponse(res, 200, "Digital output readings retrieved", rows.reverse());
  } catch (error) {
    next(error);
  }
});

// GET all digital output tags
router.get("/tags", async (req, res, next) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      "SELECT * FROM digital_output_tags ORDER BY id"
    );
    connection.release();

    apiResponse(res, 200, "Digital output tags retrieved", rows);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
