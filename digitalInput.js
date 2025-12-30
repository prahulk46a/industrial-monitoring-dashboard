app.get("/api/digital-inputs/tags", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      "SELECT * FROM digital_input_tags ORDER BY id"
    );
    connection.release();

    apiResponse(res, 200, "Digital input tags retrieved", rows);
  } catch (error) {
    handleError(res, error);
  }
});

// GET specific digital input tag with latest reading
app.get("/api/digital-inputs/:tagId", async (req, res) => {
  try {
    const { tagId } = req.params;
    const connection = await pool.getConnection();

    const [tag] = await connection.execute(
      "SELECT * FROM digital_input_tags WHERE tag_id = ?",
      [tagId]
    );

    if (tag.length === 0) {
      connection.release();
      return apiResponse(res, 404, "Tag not found");
    }

    const [readings] = await connection.execute(
      "SELECT * FROM digital_input_readings WHERE tag_id = ? ORDER BY timestamp DESC LIMIT 1",
      [tagId]
    );

    connection.release();

    apiResponse(res, 200, "Digital input retrieved", {
      tag: tag[0],
      latestReading: readings[0] || null,
    });
  } catch (error) {
    handleError(res, error);
  }
});