// api/transcribe.js — Vercel Serverless Function

import multer from "multer";
import fs from "fs";
import { AssemblyAI } from "assemblyai";

// ✅ Required so Vercel doesn't parse multipart (Angular requires this)
export const config = {
  api: {
    bodyParser: false,
  },
};

// ✅ Save uploaded audio to tmp folder (allowed in Vercel)
const upload = multer({ dest: "/tmp" });

// ✅ Initialize AssemblyAI (v4 SDK)
const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY,
});

export default function handler(req, res) {
  // ✅ CORS
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:4200");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, session_id"
  );

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST allowed" });

  upload.single("file")(req, res, async (err) => {
    if (err || !req.file) {
      console.error("❌ No file received:", err);
      return res.status(400).json({ error: "File upload failed" });
    }

    console.log("🎤 received file:", req.file);

    try {
      const buffer = fs.readFileSync(req.file.path);

      // ✅ This is the ONLY format AssemblyAI v4 accepts for local/buffer
      const transcript = await client.transcripts.transcribe({
        audio: buffer,
        language_code: "en_us",
        punctuate: true,
        format_text: true,
      });

      console.log("✅ TEXT:", transcript.text);

      fs.unlinkSync(req.file.path); // cleanup

      return res.status(200).json({ text: transcript.text || "" });

    } catch (error) {
      console.error("❌ AssemblyAI error:", error);
      return res.status(500).json({ error: "Transcription failed" });
    }
  });
}
