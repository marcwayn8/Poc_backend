// api/transcribe.js  (Vercel Serverless Function)

import multer from "multer";
import fs from "fs";
import { createClient } from "@deepgram/sdk";

/** ✅ Required so Vercel doesn't try to parse the body */
export const config = {
  api: {
    bodyParser: false,
  },
};

// ✅ Save uploaded audio temporarily (serverless safe)
const upload = multer({ dest: "/tmp" });

// ✅ Deepgram v3 client
const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

export default async function handler(req, res) {
  // ✅ CORS (prevents blocked requests in Angular)
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

  // ✅ Handle file upload from Angular
  upload.single("file")(req, res, async (err) => {
    if (err || !req.file) {
      console.error("❌ No file received", err);
      return res.status(400).json({ error: "File upload failed" });
    }

    console.log("📥 received file:", req.file);

    try {
      const buffer = fs.readFileSync(req.file.path);

      // ✅ NEW: WAV ready Deepgram API call
      const response = await deepgram.listen.prerecorded.transcribeFile(buffer, {
        model: "nova",
        language: "en-US",
        smart_format: true,
        punctuate: true,
      });

      console.log("🔎 FULL DEEPGRAM RESPONSE >>>");
      console.log(JSON.stringify(response, null, 2));

      const transcript =
        response?.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";

      console.log("✅ TRANSCRIPT:", transcript);

      fs.unlinkSync(req.file.path); // cleanup tmp file

      return res.status(200).json({ text: transcript });

    } catch (error) {
      console.error("❌ Deepgram error:", error);
      return res.status(500).json({ error: "Transcription failed" });
    }
  });
}
