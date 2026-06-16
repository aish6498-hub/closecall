import express from "express";
import { ObjectId } from "mongodb";
import { connectDB } from "../db/connection.js";

const router = express.Router();

// GET /api/observations - Returns all observations, newest first

router.get("/", async (req, res) => {
  try {
    const db = await connectDB();
    const observations = await db
      .collection("observations")
      .find()
      .sort({ createdAt: -1 })
      .toArray();
    res.json(observations);
  } catch (err) {
    console.error("GET /observations error:", err);
    res.status(500).json({ error: "Failed to fetch observations" });
  }
});

// POST /api/observations - Logs a new observation

router.post("/", async (req, res) => {
  try {
    const {
      nasaId,
      asteroidName,
      title,
      tag,
      dangerRating,
      notes,
      isHazardous,
      approachDate,
      missDistance,
      estimatedSize,
    } = req.body;

    if (!nasaId || !asteroidName || !dangerRating) {
      return res
        .status(400)
        .json({ error: "nasaId, asteroidName and dangerRating are required" });
    }

    const newObservation = {
      nasaId,
      asteroidName,
      title: title || `${asteroidName} — ${approachDate}`,
      tag: tag || "",
      dangerRating: Number(dangerRating),
      notes: notes || "",
      isHazardous: Boolean(isHazardous),
      approachDate: approachDate || "",
      missDistance: missDistance || "",
      estimatedSize: estimatedSize || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const db = await connectDB();
    const result = await db
      .collection("observations")
      .insertOne(newObservation);

    res.status(201).json({ ...newObservation, _id: result.insertedId });
  } catch (err) {
    console.error("POST /observations error:", err);
    res.status(500).json({ error: "Failed to save observation" });
  }
});

// PUT /api/observations/:id - Edits an existing observation (user fields only)

router.put("/:id", async (req, res) => {
  try {
    const id = new ObjectId(req.params.id);
    const { title, tag, dangerRating, notes } = req.body;

    const updates = {
      ...(title !== undefined && { title }),
      ...(tag !== undefined && { tag }),
      ...(dangerRating !== undefined && { dangerRating: Number(dangerRating) }),
      ...(notes !== undefined && { notes }),
      updatedAt: new Date(),
    };

    const db = await connectDB();
    const result = await db
      .collection("observations")
      .findOneAndUpdate(
        { _id: id },
        { $set: updates },
        { returnDocument: "after" }
      );

    if (!result) {
      return res.status(404).json({ error: "Observation not found" });
    }

    res.json(result);
  } catch (err) {
    if (err.message.includes("input must be a 24 character hex string")) {
      return res.status(400).json({ error: "Invalid observation ID" });
    }
    console.error("PUT /observations/:id error:", err);
    res.status(500).json({ error: "Failed to update observation" });
  }
});

// DELETE /api/observations/:id - Deletes an observation

router.delete("/:id", async (req, res) => {
  try {
    const id = new ObjectId(req.params.id);

    const db = await connectDB();
    const result = await db.collection("observations").deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Observation not found" });
    }

    res.json({ deleted: true, id: req.params.id });
  } catch (err) {
    if (err.message.includes("input must be a 24 character hex string")) {
      return res.status(400).json({ error: "Invalid observation ID" });
    }
    console.error("DELETE /observations/:id error:", err);
    res.status(500).json({ error: "Failed to delete observation" });
  }
});

export default router;
