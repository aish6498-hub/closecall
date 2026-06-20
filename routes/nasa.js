import express from "express";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function shapeNeo(neo, approach) {
  const meters = neo.estimated_diameter.meters;
  return {
    id: neo.id,
    name: neo.name,
    hazardous: neo.is_potentially_hazardous_asteroid,
    approachDate: approach.close_approach_date,
    missLD: Number(approach.miss_distance.lunar),
    velocityKms: Number(approach.relative_velocity.kilometers_per_second),
    diameterMinM: meters.estimated_diameter_min,
    diameterMaxM: meters.estimated_diameter_max,
  };
}
 
router.get("/feed", async (req, res) => {
  try {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 7); 
 
    const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${isoDate(
      start
    )}&end_date=${isoDate(end)}&api_key=${process.env.NASA_API_KEY}`;
 
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).json({ error: "NASA API error" });
    }
    const data = await response.json();
 
    const rows = [];
    for (const day of Object.values(data.near_earth_objects)) {
      for (const neo of day) {
        const approach = neo.close_approach_data[0];
        if (approach) rows.push(shapeNeo(neo, approach));
      }
    }
 
    res.json({
      start: isoDate(start),
      end: isoDate(end),
      count: rows.length,
      objects: rows,
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch from NASA" });
  }
});

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
