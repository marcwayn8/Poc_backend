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
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  upload.single("file")(req, res, async (err) => {
    if (err || !req.file) {
      console.error("❌ File upload failed");
      return res.status(400).json({ error: "File upload failed" });
    }

    try {
      console.log("📥 received file:", req.file);

      const buffer = fs.readFileSync(req.file.path);
      fs.unlinkSync(req.file.path);

      const response = await deepgram.listen.prerecorded.transcribeFile(
        {
          buffer,
          mimetype: "audio/webm;codecs=opus"  
        },
        {
          model: "nova",
          model: "nova",
          smart_format: true,
          language: "en-US",
        }
      );

      const transcript =
        response?.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";

      console.log("✅ Deepgram transcript:", transcript);

      return res.status(200).json({ text: transcript });
    } catch (error) {
      console.error("❌ Deepgram error:", error);
      return res.status(500).json({ error: "Transcription failed" });
    }
  });
}