import { Router } from "express";
import { ObjectId } from "mongodb";
import { connectDB } from "../db/connection.js";

const router = Router();
const COLLECTION = "watchlist";

// GET /api/watchlist — every saved asteroid (newest first).
router.get("/", async (req, res) => {
  try {
    const db = await connectDB();
    const items = await db
      .collection(COLLECTION)
      .find()
      .sort({ addedAt: -1 })
      .toArray();
    res.json(items);
  } catch (err) {
    console.error("Watchlist read error:", err);
    res.status(500).json({ error: "Couldn't load your watchlist." });
  }
});

// POST /api/watchlist — save an asteroid from the feed.
router.post("/", async (req, res) => {
  try {
    const { neoId, name, hazardous, tag, note } = req.body;
    if (!neoId || !name) {
      return res.status(400).json({ error: "neoId and name are required." });
    }

    const db = await connectDB();

    const existing = await db.collection(COLLECTION).findOne({ neoId });
    if (existing) {
      return res.status(409).json({ error: "Already on your watchlist." });
    }

    const doc = {
      neoId,
      name,
      hazardous: Boolean(hazardous),
      tag: tag || "",
      note: note || "",
      addedAt: new Date(),
    };

    const result = await db.collection(COLLECTION).insertOne(doc);
    res.status(201).json({ _id: result.insertedId, ...doc });
  } catch (err) {
    console.error("Watchlist create error:", err);
    res.status(500).json({ error: "Couldn't save that asteroid." });
  }
});

// PUT /api/watchlist/:id — update the tag and note.
router.put("/:id", async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Bad id." });
    }
    const { tag, note } = req.body;

    const db = await connectDB();
    const result = await db
      .collection(COLLECTION)
      .updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { tag: tag || "", note: note || "" } }
      );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Not found." });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("Watchlist update error:", err);
    res.status(500).json({ error: "Couldn't update that entry." });
  }
});

// DELETE /api/watchlist/:id — remove from the watchlist.
router.delete("/:id", async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Bad id." });
    }
    const db = await connectDB();
    const result = await db
      .collection(COLLECTION)
      .deleteOne({ _id: new ObjectId(req.params.id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Not found." });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("Watchlist delete error:", err);
    res.status(500).json({ error: "Couldn't delete that entry." });
  }
});

export default router;
