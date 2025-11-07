import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json());

// --- File uploads temp location
const upload = multer({ dest: "uploads/" });

// --- OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// --- Health check
app.get("/", (req, res) => {
  res.send("🚀 Whisper backend is live");
});

// --- Transcription endpoint
app.post("/transcribe", upload.single("file"), async (req, res) => {
  try {
    const result = await client.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: "whisper-1",
      response_format: "json"
    });

    res.json({ text: result.text });

    // delete uploaded file
    fs.unlinkSync(req.file.path);
  } catch (error) {
    console.error("❌ Whisper API Error:", error);
    res.status(500).json({ error: "Transcription failed" });
  }
});

// --- Start server
app.listen(5000, () =>
  console.log("✅ Whisper backend running at http://localhost:5000")
);
