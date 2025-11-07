import multer from "multer";
import fs from "fs";
import OpenAI from "openai";

export const config = {
  api: {
    bodyParser: false,
  },
};

const upload = multer({ dest: "/tmp" });

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  upload.single("file")(req, res, async (err) => {
    if (err || !req.file) {
      return res.status(400).json({ error: "No audio file received" });
    }

    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const result = await openai.audio.transcriptions.create({
        file: fs.createReadStream(req.file.path),
        model: "whisper-1"
      });

      res.status(200).json({ text: result.text });

      fs.unlinkSync(req.file.path); 
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Transcription failed" });
    }
  });
}
