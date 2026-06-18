import express from "express";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

router.get("/neo/:id", async (req, res) => {
  try {
    const url = `https://api.nasa.gov/neo/rest/v1/neo/${req.params.id}?api_key=${process.env.NASA_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).json({ error: "NASA API error" });
    }
    const data = await response.json();
    res.json(data);
  } catch {
    res.status(500).json({ error: "Failed to fetch from NASA" });
  }
});

export default router;
