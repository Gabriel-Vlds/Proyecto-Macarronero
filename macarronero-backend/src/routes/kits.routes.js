// Endpoints para kits y catalogo de MacarroKits.
const express = require('express');
const { pool } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, name, description, price, stock, image_url, created_at, updated_at FROM kits'
  );
  return res.json(rows);
});

router.post('/', authenticate, requireRole('admin'), async (req, res) => {
  const { name, description, price, stock, imageUrl } = req.body;

  if (!name || price == null || stock == null) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  const [result] = await pool.query(
    'INSERT INTO kits (name, description, price, stock, image_url) VALUES (?, ?, ?, ?, ?)',
    [name, description || '', price, stock, imageUrl || null]
  );

  const [rows] = await pool.query(
    'SELECT id, name, description, price, stock, image_url, created_at, updated_at FROM kits WHERE id = ?',
    [result.insertId]
  );

  return res.status(201).json(rows[0]);
});

router.patch('/:id', authenticate, requireRole('admin'), async (req, res) => {
  const { name, description, price, stock, imageUrl } = req.body;
  const updates = [];
  const values = [];

  if (name) {
    updates.push('name = ?');
    values.push(name);
  }
  if (description != null) {
    updates.push('description = ?');
    values.push(description);
  }
  if (price != null) {
    updates.push('price = ?');
    values.push(price);
  }
  if (stock != null) {
    updates.push('stock = ?');
    values.push(stock);
  }
  if (imageUrl !== undefined) {
    updates.push('image_url = ?');
    values.push(imageUrl);
  }

  if (updates.length === 0) {
    return res.status(400).json({ message: 'No updates provided' });
  }

  values.push(req.params.id);
  await pool.query(`UPDATE kits SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`, values);

  const [rows] = await pool.query(
    'SELECT id, name, description, price, stock, image_url, created_at, updated_at FROM kits WHERE id = ?',
    [req.params.id]
  );

  return res.json(rows[0]);
});

router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  await pool.query('DELETE FROM kits WHERE id = ?', [req.params.id]);
  return res.status(204).send();
});

module.exports = { kitsRoutes: router };
