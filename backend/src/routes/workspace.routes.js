import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { createId, ensureSeedData, getStore, saveStore } from '../data/store.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (_req, res) => {
  ensureSeedData();
  const store = getStore();

  const workspaces = store.workspaces.map((workspace) => {
    // Resolve member details
    const memberDetails = (workspace.members || []).map((m) => {
      if (typeof m === 'object' && m !== null) return m;
      const foundUser = store.users.find((u) => u.id === m);
      if (foundUser) {
        return {
          id: foundUser.id,
          name: foundUser.name,
          email: foundUser.email,
          role: foundUser.role || 'Member',
        };
      }
      return { id: m, name: m === workspace.ownerId ? 'Workspace Owner' : 'Teammate', email: `${m}@northstar.io`, role: 'Member' };
    });

    return {
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      owner: workspace.ownerId,
      createdAt: workspace.createdAt,
      members: memberDetails,
      resources: workspace.resources || [
        { id: 'res-1', title: 'Product Launch Checklist & Runbook', type: 'doc', link: 'https://docs.intellmeet.app/runbook' },
        { id: 'res-2', title: 'Customer Discovery Call Recordings & Transcripts', type: 'audio', link: 'https://meet.intellmeet.app/transcripts' },
        { id: 'res-3', title: 'Q4 Product Roadmap & Sprint Board', type: 'kanban', link: 'https://jira.intellmeet.app/q4' },
      ],
    };
  });

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
    members: [
      { id: req.user.id, name: req.user.name, email: req.user.email, role: 'Owner' },
    ],
    resources: [],
  };

  getStore().workspaces.unshift(workspace);
  saveStore();

  return res.status(201).json({
    message: 'Workspace created.',
    workspace,
  });
});

// Invite a member to the workspace
router.post('/:workspaceId/members', (req, res) => {
  ensureSeedData();
  const { workspaceId } = req.params;
  const { name, email, role } = req.body;

  if (!email && !name) {
    return res.status(400).json({ message: 'Name or email is required.' });
  }

  const workspace = getStore().workspaces.find((w) => w.id === workspaceId);
  if (!workspace) {
    return res.status(404).json({ message: 'Workspace not found.' });
  }

  if (!Array.isArray(workspace.members)) {
    workspace.members = [];
  }

  const newMember = {
    id: createId('usr'),
    name: name || email.split('@')[0],
    email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@northstar.io`,
    role: role || 'Member',
    joinedAt: new Date().toISOString(),
  };

  workspace.members.push(newMember);
  saveStore();

  return res.status(201).json({
    message: `Invited ${newMember.name} to workspace.`,
    member: newMember,
    members: workspace.members,
  });
});

// Add a shared resource to the workspace
router.post('/:workspaceId/resources', (req, res) => {
  ensureSeedData();
  const { workspaceId } = req.params;
  const { title, type, link } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Resource title is required.' });
  }

  const workspace = getStore().workspaces.find((w) => w.id === workspaceId);
  if (!workspace) {
    return res.status(404).json({ message: 'Workspace not found.' });
  }

  if (!Array.isArray(workspace.resources)) {
    workspace.resources = [];
  }

  const newResource = {
    id: createId('res'),
    title: title.trim(),
    type: type || 'doc',
    link: link || 'https://intellmeet.app/resource',
    addedAt: new Date().toISOString(),
  };

  workspace.resources.unshift(newResource);
  saveStore();

  return res.status(201).json({
    message: 'Resource added.',
    resource: newResource,
    resources: workspace.resources,
  });
});

export default router;
