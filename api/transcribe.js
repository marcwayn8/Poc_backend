import multer from "multer";
import fs from "fs";
import { createClient } from "@deepgram/sdk";


export const config = {
  api: {
    bodyParser: false,
  },
};

// ✅ Multer handles multipart audio upload
const upload = multer({ dest: "/tmp" });

export default function handler(req, res) {
  // ✅ CORS + preflight — DO NOT REMOVE
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

  // ✅ process audio upload
  upload.single("file")(req, res, async (err) => {
    if (err || !req.file) {
      return res.status(400).json({ error: "File upload failed" });
    }

    try {
      const buffer = fs.readFileSync(req.file.path);
      fs.unlinkSync(req.file.path);

      // ✅ Deepgram client (new format v3)
      const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

      const response = await deepgram.listen.prerecorded.transcribeFile(buffer, {
        model: "nova",
        smart_format: true,
        language: "en-US",
      });

      const transcript =
        response.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";

      return res.status(200).json({ text: transcript });
    } catch (error) {
      console.error("❌ Deepgram error:", error);
      return res.status(500).json({ error: "Transcription failed" });
    }
  });
}
