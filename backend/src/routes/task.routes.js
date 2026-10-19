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

router.post('/bulk', (req, res) => {
  ensureSeedData();
  const items = Array.isArray(req.body.tasks) ? req.body.tasks : [];
  if (!items.length) {
    return res.status(400).json({ message: 'No tasks provided.' });
  }

  const createdTasks = items.map((item) => ({
    id: createId('task'),
    title: item.title || (typeof item === 'string' ? item : 'Action item'),
    status: item.status || 'To Do',
    priority: item.priority || 'Medium',
    owner: item.owner || item.assignee || req.user?.name || 'Unassigned',
  }));

  getStore().tasks.unshift(...createdTasks);
  saveStore();

  return res.status(201).json({
    message: `Successfully created ${createdTasks.length} tasks`,
    tasks: createdTasks,
  });
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
