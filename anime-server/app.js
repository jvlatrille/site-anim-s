// app.js
import express from "express";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import 'dotenv/config';


import torrentRouter from "./routes/torrent.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 🔧 désactive l'ETag et le cache pour éviter les 304 qui vident le body
app.set('etag', false);
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.use("/api", torrentRouter);

app.get("/health", (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API up on http://localhost:${PORT}`);
});
