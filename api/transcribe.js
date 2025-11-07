import multer from "multer";
import fs from "fs";
import { createClient } from "@deepgram/sdk";

// ✅ Required so Vercel does not try to parse body
export const config = {
  api: {
    bodyParser: false,
  },
};

// ✅ Save incoming audio temporarily
const upload = multer({ dest: "/tmp" });

// ✅ Deepgram client (v3 SDK)
const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

export default async function handler(req, res) {
  // ✅ CORS + preflight support — DO NOT REMOVE
 res.setHeader("Access-Control-Allow-Origin", "http://localhost:4200");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, session_id"
  );

  if (req.method === "OPTIONS") {
    console.log("✅ Preflight request handled");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ✅ Handle file upload from Angular formData
  upload.single("file")(req, res, async (err) => {
    if (err || !req.file) {
      console.error("❌ File upload failed:", err);
      return res.status(400).json({ error: "File upload failed" });
    }

    try {
      console.log("🎤 Audio file received:", req.file.path);

      // ✅ Read audio bytes
      const buffer = fs.readFileSync(req.file.path);

      // ✅ Send to Deepgram for transcription
      const response = await deepgram.listen.prerecorded.transcribeFile(buffer, {
        model: "nova",
        smart_format: true,
        language: "en-US",
      });

      const transcript =
        response.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";

      console.log("✅ Transcript:", transcript);

      // ✅ Cleanup temporary file
      fs.unlinkSync(req.file.path);

      return res.status(200).json({ text: transcript });
    } catch (error) {
      console.error("❌ Deepgram Transcription Error:", error);
      return res.status(500).json({ error: "Transcription failed" });
    }
  });
}
