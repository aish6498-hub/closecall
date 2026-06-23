import express from "express";
import dotenv from "dotenv";
import observationsRouter from "./routes/observations.js";
import nasaRouter from "./routes/nasa.js";
import watchlistRouter from "./routes/watchlist.js";
dotenv.config();

console.log("Hello from backend!");

const PORT = process.env.PORT || 3000;
const app = express();

// 1. Middleware
app.use(express.json());

// 2. API Routes
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
app.use("/api/observations", observationsRouter);
app.use("/api/nasa", nasaRouter);
app.use("/api/watchlist", watchlistRouter);

// 3. Static Files

app.use(express.static("frontend"));

// 4. Keep-alive listener
const server = app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});

process.on("SIGINT", () => {
  server.close(() => {
    process.exit(0);
  });
});
