import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { createId, ensureSeedData, getStore, sanitizeUser } from '../data/store.js';

export async function register(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  try {
    ensureSeedData();
    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = getStore().users.find((user) => user.email === normalizedEmail);

    if (existingUser) {
      return res.status(409).json({ message: 'User already exists.' });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = {
      id: createId('user'),
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash,
      theme: 'dark',
      role: 'member',
      avatar: '',
      createdAt: new Date().toISOString(),
    };

    getStore().users.push(user);

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, env.jwtSecret, { expiresIn: '7d' });
    return res.status(201).json({
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Registration failed.' });
  }
}

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    ensureSeedData();
    const normalizedEmail = String(email).trim().toLowerCase();
    const user = getStore().users.find((candidate) => candidate.email === normalizedEmail);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const isValid = await bcrypt.compare(String(password), user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, env.jwtSecret, { expiresIn: '7d' });
    return res.json({
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Login failed.' });
  }
}

export async function getMe(req, res) {
  try {
    ensureSeedData();
    const user = getStore().users.find((candidate) => candidate.id === req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch profile.' });
  }
}
