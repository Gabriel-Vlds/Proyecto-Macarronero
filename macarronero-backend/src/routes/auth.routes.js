// Endpoints de autenticacion: login y registro.
const express = require('express');
const { pool } = require('../db');
const { hashPassword, comparePassword } = require('../utils/password');
const { signToken } = require('../utils/jwt');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) {
    return res.status(409).json({ message: 'Email already exists' });
  }

  const passwordHash = await hashPassword(password);
  const [result] = await pool.query(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [name, email, passwordHash, 'customer']
  );

  const user = { id: result.insertId, name, email, role: 'customer' };
  const token = signToken(user);

  return res.status(201).json({ token, user });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  const [rows] = await pool.query(
    'SELECT id, name, email, password_hash, role FROM users WHERE email = ?',
    [email]
  );

  if (rows.length === 0) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const userRow = rows[0];
  const match = await comparePassword(password, userRow.password_hash);
  if (!match) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const user = {
    id: userRow.id,
    name: userRow.name,
    email: userRow.email,
    role: userRow.role
  };
  const token = signToken(user);

  return res.json({ token, user });
});

router.get('/me', authenticate, async (req, res) => {
  const [rows] = await pool.query('SELECT id, name, email, role FROM users WHERE id = ?', [
    req.user.id
  ]);

  if (rows.length === 0) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.json(rows[0]);
});

module.exports = { authRoutes: router };
