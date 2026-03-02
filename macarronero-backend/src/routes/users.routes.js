// Endpoints para gestion de usuarios.
const express = require('express');
const { pool } = require('../db');
const { authenticate, requireRole, requireSelfOrAdmin } = require('../middleware/auth');
const { hashPassword } = require('../utils/password');

const router = express.Router();

router.get('/', authenticate, requireRole('admin'), async (req, res) => {
  const [rows] = await pool.query('SELECT id, name, email, role, created_at FROM users');
  return res.json(rows);
});

router.get('/:id', authenticate, requireSelfOrAdmin, async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
    [req.params.id]
  );

  if (rows.length === 0) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.json(rows[0]);
});

router.patch('/:id', authenticate, requireSelfOrAdmin, async (req, res) => {
  const { name, email, role, password } = req.body;
  const updates = [];
  const values = [];

  if (name) {
    updates.push('name = ?');
    values.push(name);
  }
  if (email) {
    updates.push('email = ?');
    values.push(email);
  }
  if (role && req.user.role === 'admin') {
    updates.push('role = ?');
    values.push(role);
  }
  if (password) {
    const passwordHash = await hashPassword(password);
    updates.push('password_hash = ?');
    values.push(passwordHash);
  }

  if (updates.length === 0) {
    return res.status(400).json({ message: 'No updates provided' });
  }

  values.push(req.params.id);
  await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

  const [rows] = await pool.query(
    'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
    [req.params.id]
  );

  return res.json(rows[0]);
});

router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
  return res.status(204).send();
});

module.exports = { usersRoutes: router };
