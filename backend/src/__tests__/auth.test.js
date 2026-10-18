import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import app from '../app.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storeFile = path.resolve(__dirname, '../../data/demo-store.json');

test('register and login use the in-memory demo store', async () => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/api`;

  const email = `tester-${Date.now()}@example.com`;
  const payload = { name: 'Test User', email, password: 'Password123!' };

  let response = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  assert.equal(response.status, 201);
  const { token, user } = await response.json();
  assert.ok(token);
  assert.equal(user.email, email);

  response = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Password123!' }),
  });

  assert.equal(response.status, 200);
  const login = await response.json();
  assert.ok(login.token);
  assert.equal(login.user.email, email);

  response = await fetch(`${baseUrl}/workspaces`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  assert.equal(response.status, 200);
  const workspacePayload = await response.json();
  assert.ok(Array.isArray(workspacePayload.workspaces));

  await new Promise((resolve) => server.close(resolve));
});

test('task updates are persisted to the JSON demo store', async () => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/api`;

  const email = `persist-${Date.now()}@example.com`;
  const registerResponse = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Persistent User', email, password: 'Password123!' }),
  });

  assert.equal(registerResponse.status, 201);
  const { token } = await registerResponse.json();

  const createTaskResponse = await fetch(`${baseUrl}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title: 'Ship the demo flow', priority: 'High', status: 'In Progress', owner: 'Persistent User' }),
  });

  assert.equal(createTaskResponse.status, 201);
  const createdTask = await createTaskResponse.json();
  assert.equal(createdTask.task.title, 'Ship the demo flow');

  const updateResponse = await fetch(`${baseUrl}/tasks/${createdTask.task.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status: 'Done' }),
  });

  assert.equal(updateResponse.status, 200);
  const updatedTask = await updateResponse.json();
  assert.equal(updatedTask.task.status, 'Done');

  const persisted = fs.readFileSync(storeFile, 'utf8');
  assert.match(persisted, /Ship the demo flow/);
  assert.match(persisted, /"status": "Done"/);

  await new Promise((resolve) => server.close(resolve));
});
