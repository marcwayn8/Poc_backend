import multer from "multer";
import fs from "fs";
import OpenAI from "openai";

export const config = {
  api: {
    bodyParser: false, // required for file uploads
  },
};

// Use temp directory for files
const upload = multer({ dest: "/tmp" });

export default function handler(req, res) {
  upload.single("file")(req, res, async (err) => {
    if (err) return res.status(500).json({ error: "Upload error" });

    try {
      const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const result = await client.audio.transcriptions.create({
        file: fs.createReadStream(req.file.path),
        model: "whisper-1",
      });

      res.status(200).json({ text: result.text });

      fs.unlinkSync(req.file.path);
    } catch (error) {
      console.error("❌ Whisper API Error:", error);
      res.status(500).json({ error: "Transcription failed" });
    }
  });
}
