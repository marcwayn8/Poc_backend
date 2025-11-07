import multer from "multer";
import OpenAI from "openai";
import fs from "fs";

export const config = {
  api: { bodyParser: false },
};

const upload = multer({ dest: "/tmp" });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  upload.single("file")(req, {}, async (err) => {
    if (err || !req.file) {
      return res.status(400).json({ error: "File upload error" });
    }

    try {
      const result = await openai.audio.transcriptions.create({
        model: "whisper-1",
        file: fs.createReadStream(req.file.path),
      });

      res.json({ text: result.text });

    } catch (e) {
      console.error("❌ Whisper backend Error:", e);
      res.status(500).json({ error: "Transcription failed" });
    }
  });
}
