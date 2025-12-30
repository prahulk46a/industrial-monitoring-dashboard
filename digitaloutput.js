// GET all digital output tags
app.get("/api/digital-outputs/tags", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      "SELECT * FROM digital_output_tags ORDER BY id"
    );
    connection.release();

    apiResponse(res, 200, "Digital output tags retrieved", rows);
  } catch (error) {
    handleError(res, error);
  }
});

// GET specific digital output with latest reading
app.get("/api/digital-outputs/:tagId", async (req, res) => {
  try {
    const { tagId } = req.params;
    const connection = await pool.getConnection();

    const [tag] = await connection.execute(
      "SELECT * FROM digital_output_tags WHERE tag_id = ?",
      [tagId]
    );

    if (tag.length === 0) {
      connection.release();
      return apiResponse(res, 404, "Tag not found");
    }

    const [readings] = await connection.execute(
      "SELECT * FROM digital_output_readings WHERE tag_id = ? ORDER BY timestamp DESC LIMIT 1",
      [tagId]
    );

    connection.release();

    apiResponse(res, 200, "Digital output retrieved", {
      tag: tag[0],
      latestReading: readings[0] || null,
    });
  } catch (error) {
    handleError(res, error);
  }
});
