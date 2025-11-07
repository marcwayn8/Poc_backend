import multer from "multer";
import fs from "fs";
import { Deepgram } from "@deepgram/sdk";

export const config = {
  api: {
    bodyParser: false,
  },
};

const upload = multer({ dest: "/tmp" });

// ✅ Deepgram client
const deepgram = new Deepgram(process.env.DEEPGRAM_API_KEY);

export default async function handler(req, res) {
  // ✅ DO NOT REMOVE — CORS / preflight handling
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
    return res.status(405).json({ error: "Only POST allowed" });
  }

  upload.single("file")(req, res, async (err) => {
    if (err || !req.file) {
      console.error("❌ Multer upload error:", err);
      return res.status(400).json({ error: "File upload error" });
    }

    try {
      console.log("✅ File received:", req.file.path);

      const audioBuffer = fs.readFileSync(req.file.path);

      // ✅ Deepgram transcription
      const response = await deepgram.transcription.preRecorded(
        { buffer: audioBuffer, mimetype: "audio/webm" },
        { model: "nova" }
      );

      const transcription =
        response?.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";

      console.log("🎤 Transcription:", transcription);

      res.status(200).json({ text: transcription });

      fs.unlinkSync(req.file.path); // cleanup temp file
    } catch (error) {
      console.error("❌ Transcription error:", error);
      return res.status(500).json({ error: "Transcription failed" });
    }
  });
}
