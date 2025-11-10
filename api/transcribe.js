// api/transcribe.js (Vercel serverless function)
import multer from "multer";
import fs from "fs";
import { AssemblyAI } from "assemblyai";

// required so Vercel doesn't auto-parse multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

// temporary local storage
const upload = multer({ dest: "/tmp" });

// initialize AssemblyAI client
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
      console.error("❌ File upload failed");
      return res.status(400).json({ error: "File upload failed" });
    }

    console.log("🎤 received file:", req.file);

    try {
      const buffer = fs.readFileSync(req.file.path);

      const transcript = await client.transcripts.create({
        audio: buffer,
        language_code: "en",
        punctuate: true,
        format_text: true,
      });

      console.log("✅ TRANSCRIPT:", transcript.text);

      fs.unlinkSync(req.file.path); // cleanup tmp file

      return res.status(200).json({ text: transcript.text });
      
    } catch (error) {
      console.error("❌ AssemblyAI error:", error);
      return res.status(500).json({ error: "Transcription failed" });
    }
  });
}
