import multer from "multer";
import fs from "fs";
import OpenAI from "openai";

export const config = {
  api: {
    bodyParser: false,
  },
};

const upload = multer({ dest: "/tmp" });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  // CORS FIX
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

  // ✅ Handle the audio upload
  upload.single("file")(req, res, async (err) => {
    if (err || !req.file) {
      console.error("❌ Multer upload error:", err);
      return res.status(400).json({ error: "File upload error" });
    }

    try {
      console.log("✅ File received:", req.file.path);

      const audioFile = fs.createReadStream(req.file.path);

      // ✅ New GPT-4o audio transcription format
      const result = await openai.chat.completions.create({
        model: "gpt-4o-mini-transcribe",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "input_audio",
                input_audio: {
                  data: audioFile,
                  format: "webm", // or wav
                },
              },
            ],
          },
        ],
      });

      const transcription = result.choices[0].message.content[0].text;

      console.log("🎤 Transcription:", transcription);

      res.status(200).json({ text: transcription });

      fs.unlinkSync(req.file.path); // cleanup temp file
    } catch (error) {
      console.error("❌ Whisper backend error:", error);
      return res.status(500).json({ error: "Transcription failed" });
    }
  });
}