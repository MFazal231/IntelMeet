import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { createId, ensureSeedData, getStore, saveStore } from '../data/store.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (_req, res) => {
  ensureSeedData();
  res.json({ tasks: getStore().tasks });
});

router.post('/', (req, res) => {
  ensureSeedData();
  const { title, priority, status, owner } = req.body;
  const task = {
    id: createId('task'),
    title: title || 'New Action Item',
    status: status || 'To Do',
    priority: priority || 'Medium',
    owner: owner || req.user?.name || 'Unassigned',
  };

  getStore().tasks.unshift(task);
  saveStore();

  return res.status(201).json({ task });
});

router.patch('/:taskId', (req, res) => {
  ensureSeedData();
  const { taskId } = req.params;
  const task = getStore().tasks.find((candidate) => candidate.id === taskId);

  if (!task) {
    return res.status(404).json({ message: 'Task not found.' });
  }

  const { title, priority, status, owner } = req.body;

  if (title) task.title = String(title);
  if (priority) task.priority = String(priority);
  if (status) task.status = String(status);
  if (owner) task.owner = String(owner);

  saveStore();
  return res.json({ task });
});

router.delete('/:taskId', (req, res) => {
  ensureSeedData();
  const { taskId } = req.params;
  const initialLength = getStore().tasks.length;
  getStore().tasks = getStore().tasks.filter((task) => task.id !== taskId);

  if (getStore().tasks.length === initialLength) {
    return res.status(404).json({ message: 'Task not found.' });
  }

  saveStore();
  return res.status(200).json({ message: 'Task deleted.', taskId });
});

export default router;
