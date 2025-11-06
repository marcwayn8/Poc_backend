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

const upload = multer({ dest: "uploads/" });

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post("/transcribe", upload.single("file"), async (req, res) => {
  try {
    const result = await client.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: "whisper-1"
    });

    res.json({ text: result.text });

    fs.unlinkSync(req.file.path);
  } catch (error) {
    console.error("❌ Whisper API Error:", error);
    res.status(500).json({ error: "Transcription failed" });
  }
});

app.listen(5000, () =>
  console.log("✅ Whisper backend running at http://localhost:5000")
);
