export const config = {
  api: { bodyParser: false },
};

import multer from "multer";
import OpenAI from "openai";
import fs from "fs";

const upload = multer({ dest: "/tmp" });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default function handler(req, res) {

  // ✅ FIX CORS HEADERS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, session_id"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  upload.single("file")(req, {}, async (err) => {
    if (err || !req.file) {
      return res.status(400).json({ error: "File upload error" });
    }

    try {
      const result = await openai.audio.transcriptions.create({
        model: "whisper-1",
        file: fs.createReadStream(req.file.path),
      });

      res.json({ text: result.text });
    } catch (e) {
      console.error("❌ Whisper backend Error:", e);
      res.status(500).json({ error: "Transcription failed" });
    }
  });
}
