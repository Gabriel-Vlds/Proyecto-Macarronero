// Endpoints para compras de kits y control de historial.
const express = require('express');
const { pool } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  const { userId } = req.query;
  const isAdmin = req.user.role === 'admin';
  const targetUserId = userId ? Number(userId) : req.user.id;

  if (!isAdmin && targetUserId !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const [rows] = await pool.query(
    `SELECT p.id, p.user_id, p.kit_id, p.quantity, p.total_price, p.created_at, k.name
     FROM kit_purchases p
     JOIN kits k ON k.id = p.kit_id
     WHERE p.user_id = ?`,
    [targetUserId]
  );

  return res.json(rows);
});

router.post('/', authenticate, async (req, res) => {
  const { kitId, quantity, userId } = req.body;
  const isAdmin = req.user.role === 'admin';
  const buyerId = isAdmin && userId ? Number(userId) : req.user.id;
  const qty = Number(quantity || 1);

  if (!kitId || qty <= 0) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [kitRows] = await connection.query(
      'SELECT id, price, stock FROM kits WHERE id = ? FOR UPDATE',
      [kitId]
    );

    if (kitRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Kit not found' });
    }

    const kit = kitRows[0];
    if (kit.stock < qty) {
      await connection.rollback();
      return res.status(409).json({ message: 'Not enough stock' });
    }

    const totalPrice = Number(kit.price) * qty;

    await connection.query('UPDATE kits SET stock = stock - ? WHERE id = ?', [qty, kitId]);

    const [result] = await connection.query(
      'INSERT INTO kit_purchases (user_id, kit_id, quantity, total_price) VALUES (?, ?, ?, ?)',
      [buyerId, kitId, qty, totalPrice]
    );

    await connection.commit();

    const [rows] = await pool.query(
      'SELECT id, user_id, kit_id, quantity, total_price, created_at FROM kit_purchases WHERE id = ?',
      [result.insertId]
    );

    return res.status(201).json(rows[0]);
  } catch (error) {
    await connection.rollback();
    return res.status(500).json({ message: 'Purchase failed' });
  } finally {
    connection.release();
  }
});

module.exports = { purchasesRoutes: router };
