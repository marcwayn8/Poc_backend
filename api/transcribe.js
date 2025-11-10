// api/transcribe.js  (Vercel Serverless Function)

import multer from "multer";
import fs from "fs";
import { AssemblyAI } from "assemblyai";

/** ✅ Required so Vercel doesn't try to parse the body */
export const config = {
  api: {
    bodyParser: false,
  },
};

// ✅ Save uploaded audio temporarily (serverless safe)
const upload = multer({ dest: "/tmp" });

// ✅ AssemblyAI client
const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY,
});

export default async function handler(req, res) {

  // ✅ CORS (allows Angular frontend)
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
      console.error("❌ No file received", err);
      return res.status(400).json({ error: "File upload failed" });
    }

    console.log("🎤 received file:", req.file);

    try {
      const buffer = fs.readFileSync(req.file.path);

      const transcript = await client.transcripts.transcribe(
        buffer,
        {
          language: "en",
          punctuate: true,
          format_text: true,
          audio_format: "webm",
        }
      );

      console.log("✅ Transcript result:", transcript.text);

      fs.unlinkSync(req.file.path); // cleanup tmp file

      return res.status(200).json({ text: transcript.text });

    } catch (error) {
      console.error("❌ AssemblyAI error:", error);
      return res.status(500).json({ error: "Transcription failed" });
    }
  });
}
