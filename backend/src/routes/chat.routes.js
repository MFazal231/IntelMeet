import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { createId, ensureSeedData, getStore, saveStore } from '../data/store.js';

const router = Router();
router.use(authMiddleware);

router.get('/:roomId', (req, res) => {
  ensureSeedData();
  const roomId = req.params.roomId;
  const messages = getStore().messagesByRoom[roomId] || [];

  res.json({ roomId, messages });
});

router.post('/:roomId', (req, res) => {
  ensureSeedData();
  const { content } = req.body;
  const roomId = req.params.roomId;
  const message = {
    id: createId('msg'),
    roomId,
    author: req.user?.name || 'Guest',
    content: String(content || 'Thanks for the update.'),
    createdAt: new Date().toISOString(),
  };

  if (!getStore().messagesByRoom[roomId]) {
    getStore().messagesByRoom[roomId] = [];
  }

  getStore().messagesByRoom[roomId].push(message);
  saveStore();

  return res.status(201).json({ message });
});

export default router;
