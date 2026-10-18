import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { summarizeMeeting } from '../services/aiService.js';

const router = Router();
router.use(authMiddleware);

router.post('/summarize', async (req, res) => {
  const { title, transcript } = req.body;

  const result = await summarizeMeeting({ title: title || 'Meeting', transcript: transcript || '' });
  return res.json(result);
});

export default router;
