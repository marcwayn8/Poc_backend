import multer from "multer";
import fs from "fs";
import OpenAI from "openai";

export const config = {
  api: {
    bodyParser: false,
    sizeLimit: "50mb"
  }
};

const upload = multer({ dest: "/tmp" });

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  upload.single("file")(req, res, async (err) => {
    if (err || !req.file) {
      return res.status(400).json({ error: "File upload error" });
    }

    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(req.file.path),
        model: "gpt-4o-mini-transcribe"
      });

      res.status(200).json({ text: transcription.text });

      fs.unlinkSync(req.file.path);
    } catch (error) {
      console.error("❌ Whisper backend error:", error);
      res.status(500).json({ error: "Transcription failed" });
    }
  });
}
