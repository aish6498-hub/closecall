import express from "express";
import dotenv from "dotenv";
import observationsRouter from "./routes/observations.js";

dotenv.config();

console.log("Hello from backend!");

const PORT = process.env.PORT || 3000;
const app = express();

// 1. Middleware
app.use(express.json());

// 2. API Routes
app.use("/api/observations", observationsRouter);

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
