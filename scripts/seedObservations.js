import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const NASA_KEY = process.env.NASA_API_KEY;
const MONGO_URI = process.env.MONGODB_URI;
const DB_NAME = "closecall";
const COLLECTION = "observations";

const SEED_LIMIT = 1000;

const notes = [
  "Unusually fast approach velocity for this size class.",
  "Worth keeping an eye on — closer than most this month.",
  "Routine pass but logging for reference.",
  "Size estimate seems off — appears larger on radar.",
  "Flagged for class seminar presentation.",
  "Interesting orbital path — highly elliptical.",
  "Closest approach in recorded history for this object.",
  "Small but fast — detection window was only 3 days.",
  "Cross-referencing with ESA data — discrepancy noted.",
  "Added to personal watchlist for follow-up.",
  "First time this asteroid has been tracked this closely.",
  "PHA status seems conservative given the miss distance.",
  "Monitoring for next approach.",
  "Speed relative to Earth unusually high this pass.",
  "NASA confidence interval on size is wide — uncertainty high.",
  null,
  null,
];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weightedRating(isHazardous) {
  if (isHazardous) return randomFrom([3, 4, 4, 5, 5, 5]);
  return randomFrom([1, 2, 2, 3, 3, 4]);
}

function generateTag(isHazardous, missDistanceLunar) {
  if (missDistanceLunar < 1) return "close call";
  if (isHazardous) return randomFrom(["watch", "close call", "interest"]);
  return randomFrom(["routine", "interest", "watch", null]);
}

function randomDate(start, end) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

function getWeekRange(weeksAgo) {
  const end = new Date();
  end.setDate(end.getDate() - weeksAgo * 7);
  const start = new Date(end);
  start.setDate(start.getDate() - 7);
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

async function fetchNASAWeek(startDate, endDate) {
  const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${startDate}&end_date=${endDate}&api_key=${NASA_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`NASA API error: ${res.status}`);
  const data = await res.json();
  return data.near_earth_objects;
}

function buildObservation(neo, approach) {
  const isHazardous = neo.is_potentially_hazardous_asteroid;
  const missDistanceLunar = parseFloat(approach.miss_distance.lunar);
  const dangerRating = weightedRating(isHazardous);
  const tag = generateTag(isHazardous, missDistanceLunar);

  const diamMin = neo.estimated_diameter.meters.estimated_diameter_min;
  const diamMax = neo.estimated_diameter.meters.estimated_diameter_max;
  const estimatedSize = Math.round((diamMin + diamMax) / 2);

  return {
    nasaId: neo.id,
    asteroidName: neo.name,
    title: `${neo.name} — ${approach.close_approach_date}`,
    estimatedSize,
    isHazardous,
    speed: `${parseFloat(approach.relative_velocity.kilometers_per_second).toFixed(2)} km/s`,
    missDistance: `${Number(approach.miss_distance.kilometers).toLocaleString(undefined, { maximumFractionDigits: 0 })} km`,
    approachDate: approach.close_approach_date,
    dangerRating,
    notes: randomFrom(notes),
    tag,
    createdAt: randomDate(new Date("2022-01-01"), new Date("2024-12-31")),
    seeded: true,
  };
}

async function seed() {
  if (!NASA_KEY || !MONGO_URI) {
    console.error("Missing NASA_API_KEY or MONGODB_URI in .env");
    process.exit(1);
  }

  const client = new MongoClient(MONGO_URI);
  await client.connect();
  console.log("Connected to MongoDB");

  const col = client.db(DB_NAME).collection(COLLECTION);

  const deleted = await col.deleteMany({ seeded: true });
  console.log(`Cleared ${deleted.deletedCount} previously seeded observations`);

  const observations = [];
  let weekIndex = 1;

  while (observations.length < SEED_LIMIT) {
    const { start, end } = getWeekRange(weekIndex);
    console.log(`Fetching NASA data: ${start} → ${end}`);

    try {
      const raw = await fetchNASAWeek(start, end);

      for (const dateKey of Object.keys(raw)) {
        for (const neo of raw[dateKey]) {
          if (observations.length >= SEED_LIMIT) break;
          const approach = neo.close_approach_data[0];
          if (!approach) continue;
          observations.push(buildObservation(neo, approach));
        }
        if (observations.length >= SEED_LIMIT) break;
      }
    } catch (err) {
      console.error(`  Error fetching week ${weekIndex}:`, err.message);
    }

    weekIndex++;
    await new Promise((r) => setTimeout(r, 1100));
  }

  await col.insertMany(observations);
  console.log(`\nInserted ${observations.length} seeded observations`);
  console.log("Done.");

  await client.close();
}

seed();
