import multer from "multer";
import fs from "fs";
import AssemblyAI from "assemblyai";

export const config = {
  api: {
    bodyParser: false, // Required so we can handle raw FormData
  },
};

// ✅ Temp storage for uploaded recordings (Vercel allows /tmp)
const upload = multer({ dest: "/tmp" });

// ✅ AssemblyAI SDK client (API key comes from Vercel Environment Variables)
const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY,
});

export default function handler(req, res) {
  // ✅ CORS so Angular can call this
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:4200");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, session_id"
  );

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST allowed" });

  // ✅ Accept multipart/form-data with file
  upload.single("file")(req, res, async (err) => {
    if (err || !req.file) {
      console.error("❌ No audio file received");
      return res.status(400).json({ error: "File upload failed" });
    }

    try {
      console.log("🎙️ AUDIO RECEIVED:", req.file);

      // Read audio file to send to AssemblyAI
      const audioBuffer = fs.readFileSync(req.file.path);

      // ✅ Upload file to AssemblyAI
      const uploadResponse = await client.files.upload(audioBuffer);
      console.log("⬆️ Uploaded to Assembly:", uploadResponse.upload_url);

      // ✅ Send transcription request
      const transcript = await client.transcripts.transcribe({
        audio_url: uploadResponse.upload_url,
        language_code: "en_us",
        punctuate: true,
      });

      console.log("✅ TRANSCRIPT:", transcript.text);

      // Cleanup temp audio file
      fs.unlinkSync(req.file.path);

      return res.status(200).json({ text: transcript.text });
    } catch (error) {
      console.error("❌ AssemblyAI error:", error);
      return res.status(500).json({ error: "Transcription failed" });
    }
  });
}
