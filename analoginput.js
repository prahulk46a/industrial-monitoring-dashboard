


// GET specific analog input with readings
app.get("/api/analog-inputs/:tagId", async (req, res) => {
  try {
    const { tagId } = req.params;
    const { limit = 50 } = req.query;
    const connection = await pool.getConnection();

    const [tag] = await connection.execute(
      "SELECT * FROM analog_input_tags WHERE tag_id = ?",
      [tagId]
    );

    if (tag.length === 0) {
      connection.release();
      return apiResponse(res, 404, "Tag not found");
    }

    const [readings] = await connection.execute(
      `SELECT * FROM analog_input_readings WHERE tag_id = ? ORDER BY timestamp DESC LIMIT ?`,
      [tagId, parseInt(limit)]
    );

    connection.release();

    apiResponse(res, 200, "Analog input retrieved", {
      tag: tag[0],
      readings,
    });
  } catch (error) {
    handleError(res, error);
  }
});
