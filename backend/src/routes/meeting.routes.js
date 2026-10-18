import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { createId, ensureSeedData, getStore, saveStore } from '../data/store.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (_req, res) => {
  ensureSeedData();
  res.json({ meetings: getStore().meetings });
});

router.post('/', (req, res) => {
  ensureSeedData();
  const { title, description, startAt, duration, timezone, participants } = req.body;
  const meeting = {
    id: createId('m'),
    title: title || 'New Meeting',
    description: description || '',
    startAt: startAt || new Date().toISOString(),
    duration: Number(duration || 45),
    timezone: timezone || 'UTC',
    status: 'scheduled',
    participants: Array.isArray(participants) && participants.length ? participants : [req.user.name],
    meetingCode: `INT-${Math.floor(1000 + Math.random() * 9000)}`,
    inviteLink: `https://meet.intellmeet.app/room/${Math.random().toString(36).slice(2, 8)}`,
  };

  getStore().meetings.unshift(meeting);
  saveStore();

  return res.status(201).json({ meeting });
});

router.patch('/:meetingId', (req, res) => {
  ensureSeedData();
  const { meetingId } = req.params;
  const meeting = getStore().meetings.find((candidate) => candidate.id === meetingId);

  if (!meeting) {
    return res.status(404).json({ message: 'Meeting not found.' });
  }

  const { title, description, status, duration, timezone, participants } = req.body;

  if (title) meeting.title = String(title);
  if (description !== undefined) meeting.description = String(description);
  if (status) meeting.status = String(status);
  if (duration) meeting.duration = Number(duration);
  if (timezone) meeting.timezone = String(timezone);
  if (Array.isArray(participants)) meeting.participants = participants;

  saveStore();
  return res.json({ meeting });
});

export default router;
