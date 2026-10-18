import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../../data');
const storeFile = path.join(dataDir, 'demo-store.json');

const defaultStore = {
  users: [],
  workspaces: [],
  meetings: [],
  tasks: [],
  messagesByRoom: {},
};

function createBaseStore() {
  return {
    users: [],
    workspaces: [
      {
        id: 'ws-1',
        name: 'Northstar Labs',
        description: 'Shared workspace for cross-functional planning, launch readiness, and customer engagement.',
        ownerId: 'user-demo',
        createdAt: new Date().toISOString(),
        members: ['user-demo', 'user-ops'],
      },
    ],
    meetings: [
      {
        id: 'm-1',
        title: 'Quarterly planning',
        description: 'Roadmap alignment and sprint planning.',
        startAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        duration: 60,
        timezone: 'UTC',
        status: 'scheduled',
        participants: ['Alicia Park', 'Marcus Chen'],
        meetingCode: 'INT-1024',
        inviteLink: 'https://meet.intellmeet.app/room/quarterly-planning',
      },
    ],
    tasks: [
      { id: 'task-1', title: 'Finalize onboarding flow', status: 'In Progress', priority: 'High', owner: 'Ava' },
      { id: 'task-2', title: 'Prepare demo script', status: 'To Do', priority: 'Medium', owner: 'Marcus' },
    ],
    messagesByRoom: {
      'room-1': [
        {
          id: 'msg-1',
          roomId: 'room-1',
          author: 'Ava',
          content: 'Thanks for the recap. Let’s prepare the launch checklist.',
          createdAt: new Date().toISOString(),
        },
      ],
    },
  };
}

function ensureDataDir() {
  fs.mkdirSync(dataDir, { recursive: true });
}

function normalizeStore(input) {
  const fallback = createBaseStore();
  return {
    users: Array.isArray(input?.users) ? input.users : fallback.users,
    workspaces: Array.isArray(input?.workspaces) ? input.workspaces : fallback.workspaces,
    meetings: Array.isArray(input?.meetings) ? input.meetings : fallback.meetings,
    tasks: Array.isArray(input?.tasks) ? input.tasks : fallback.tasks,
    messagesByRoom: input?.messagesByRoom && typeof input.messagesByRoom === 'object' ? input.messagesByRoom : fallback.messagesByRoom,
  };
}

function readStoreFile() {
  ensureDataDir();

  if (!fs.existsSync(storeFile)) {
    fs.writeFileSync(storeFile, JSON.stringify(defaultStore, null, 2), 'utf8');
    return { ...defaultStore };
  }

  try {
    const content = fs.readFileSync(storeFile, 'utf8');
    if (!content.trim()) {
      return { ...defaultStore };
    }

    return normalizeStore(JSON.parse(content));
  } catch (error) {
    console.warn('Store file is invalid or unreadable. Resetting demo data.', error.message);
    const fresh = createBaseStore();
    fs.writeFileSync(storeFile, JSON.stringify(fresh, null, 2), 'utf8');
    return fresh;
  }
}

let store = readStoreFile();

export function saveStore() {
  ensureDataDir();
  fs.writeFileSync(storeFile, JSON.stringify(store, null, 2), 'utf8');
}

export function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getStore() {
  return store;
}

export function ensureSeedData() {
  if (store.users.length > 0) {
    return;
  }

  const demoHash = bcrypt.hashSync('Password123!', 10);
  const seedUsers = [
    {
      id: 'user-demo',
      name: 'Alicia Park',
      email: 'hello@northstar.io',
      passwordHash: demoHash,
      avatar: '',
      theme: 'dark',
      role: 'owner',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'user-ops',
      name: 'Marcus Chen',
      email: 'marcus@northstar.io',
      passwordHash: bcrypt.hashSync('Password123!', 10),
      avatar: '',
      theme: 'dark',
      role: 'member',
      createdAt: new Date().toISOString(),
    },
  ];

  store.users = seedUsers;

  if (!store.workspaces.length) {
    store.workspaces.push({
      id: 'ws-1',
      name: 'Northstar Labs',
      description: 'Shared workspace for cross-functional planning, launch readiness, and customer engagement.',
      ownerId: 'user-demo',
      createdAt: new Date().toISOString(),
      members: ['user-demo', 'user-ops'],
    });
  }

  if (!store.meetings.length) {
    store.meetings.push({
      id: 'm-1',
      title: 'Quarterly planning',
      description: 'Roadmap alignment and sprint planning.',
      startAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      duration: 60,
      timezone: 'UTC',
      status: 'scheduled',
      participants: ['Alicia Park', 'Marcus Chen'],
      meetingCode: 'INT-1024',
      inviteLink: 'https://meet.intellmeet.app/room/quarterly-planning',
    });
  }

  if (!store.tasks.length) {
    store.tasks.push(
      { id: 'task-1', title: 'Finalize onboarding flow', status: 'In Progress', priority: 'High', owner: 'Ava' },
      { id: 'task-2', title: 'Prepare demo script', status: 'To Do', priority: 'Medium', owner: 'Marcus' },
    );
  }

  if (!store.messagesByRoom || !Object.keys(store.messagesByRoom).length) {
    store.messagesByRoom = {
      'room-1': [
        {
          id: 'msg-1',
          roomId: 'room-1',
          author: 'Ava',
          content: 'Thanks for the recap. Let’s prepare the launch checklist.',
          createdAt: new Date().toISOString(),
        },
      ],
    };
  }

  saveStore();
}

export function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    theme: user.theme || 'dark',
    role: user.role || 'member',
    avatar: user.avatar || '',
  };
}
