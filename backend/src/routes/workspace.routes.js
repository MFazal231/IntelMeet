import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { createId, ensureSeedData, getStore, saveStore } from '../data/store.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (_req, res) => {
  ensureSeedData();
  const workspaces = getStore().workspaces.map((workspace) => ({
    id: workspace.id,
    name: workspace.name,
    description: workspace.description,
    members: Array.isArray(workspace.members) ? workspace.members.length : 0,
    owner: workspace.ownerId,
    createdAt: workspace.createdAt,
  }));

  res.json({ workspaces });
});

router.post('/', (req, res) => {
  ensureSeedData();
  const { name, description } = req.body;
  const workspace = {
    id: createId('ws'),
    name: name || 'New Workspace',
    description: description || '',
    ownerId: req.user.id,
    createdAt: new Date().toISOString(),
    members: [req.user.id],
  };

  getStore().workspaces.unshift(workspace);
  saveStore();

  return res.status(201).json({
    message: 'Workspace created.',
    workspace: {
      ...workspace,
      members: workspace.members.length,
      owner: req.user.name,
    },
  });
});

export default router;
