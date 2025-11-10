// /api/transcribe.js

import multer from "multer";
import fs from "fs";
import { AssemblyAI } from "assemblyai";

// Required for Vercel serverless FaaS
export const config = {
  api: {
    bodyParser: false,
  },
};

// Temp storage (vercel allows /tmp writes)
const upload = multer({ dest: "/tmp" });

// AssemblyAI client
const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY,
});

export default function handler(req, res) {
  // ✅ CORS
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:4200");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, session_id"
  );

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST allowed" });

  upload.single("file")(req, res, async (err) => {
    if (err || !req.file) {
      console.error("❌ No audio file received");
      return res.status(400).json({ error: "File upload failed" });
    }

    try {
      console.log("🎤 received file:", req.file);

      const audioBuffer = fs.readFileSync(req.file.path);

      // 1️⃣ Upload audio to AssemblyAI
      const uploadRes = await client.files.upload(audioBuffer);

      // 2️⃣ Transcribe
      const transcript = await client.transcripts.transcribe({
        audio_url: uploadRes.upload_url,
        language_code: "en_us",
        punctuate: true,
      });

      console.log("✅ TRANSCRIPT:", transcript.text);

      fs.unlinkSync(req.file.path); // cleanup

      return res.status(200).json({ text: transcript.text });
    } catch (error) {
      console.error("❌ AssemblyAI error:", error);
      return res.status(500).json({ error: "Transcription failed" });
    }
  });
}
