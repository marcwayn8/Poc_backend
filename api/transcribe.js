import multer from "multer";
import fs from "fs";
import OpenAI from "openai";

export const config = {
  api: {
    bodyParser: false,
  },
};

const upload = multer({ dest: "/tmp" });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  // CORS FIX
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:4200");
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
        model: "gpt-4o-mini-transcribe",
        file: fs.createReadStream(req.file.path),
      });

      return res.status(200).json({ text: result.text });
    } catch (error) {
      console.error("❌ Whisper backend error:", error);
      return res.status(500).json({ error: "Transcription failed" });
    }
  });
}
