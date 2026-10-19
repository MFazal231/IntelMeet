import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth.js';
import { summarizeMeeting, transcribeAudioStream } from '../services/aiService.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
const router = Router();
router.use(authMiddleware);

router.post('/summarize', async (req, res) => {
  const { title, transcript } = req.body;

  const result = await summarizeMeeting({ title: title || 'Meeting', transcript: transcript || '' });
  return res.json(result);
});

router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No audio file provided.' });
    }

    const transcript = await transcribeAudioStream(req.file.buffer, req.file.mimetype);
    return res.json({ transcript });
  } catch (err) {
    console.error('Transcription route error:', err);
    return res.status(500).json({ message: 'Failed to transcribe audio', error: err.message });
  }
});

export default router;
