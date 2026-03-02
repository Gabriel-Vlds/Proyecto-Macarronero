// Endpoints para inscripciones de usuarios a cursos.
const express = require('express');
const { pool } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  const { userId } = req.query;
  const isAdmin = req.user.role === 'admin';
  const targetUserId = userId ? Number(userId) : req.user.id;

  if (!isAdmin && targetUserId !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const [rows] = await pool.query(
    `SELECT e.id, e.user_id, e.course_id, e.created_at, c.title, c.level
     FROM enrollments e
     JOIN courses c ON c.id = e.course_id
     WHERE e.user_id = ?`,
    [targetUserId]
  );

  return res.json(rows);
});

router.post('/', authenticate, async (req, res) => {
  const { userId, courseId } = req.body;
  const isAdmin = req.user.role === 'admin';
  const targetUserId = isAdmin && userId ? Number(userId) : req.user.id;
  const targetCourseId = Number(courseId);

  if (!targetUserId || !targetCourseId) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  if (!isAdmin && userId && Number(userId) !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const [courseRows] = await pool.query('SELECT id FROM courses WHERE id = ?', [targetCourseId]);
  if (courseRows.length === 0) {
    return res.status(404).json({ message: 'Course not found' });
  }

  const [existingRows] = await pool.query(
    'SELECT id FROM enrollments WHERE user_id = ? AND course_id = ? LIMIT 1',
    [targetUserId, targetCourseId]
  );

  if (existingRows.length > 0) {
    return res.status(409).json({ message: 'Already enrolled' });
  }

  await pool.query('INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)', [
    targetUserId,
    targetCourseId
  ]);

  const [rows] = await pool.query(
    'SELECT id, user_id, course_id, created_at FROM enrollments WHERE user_id = ? AND course_id = ? ORDER BY id DESC LIMIT 1',
    [targetUserId, targetCourseId]
  );

  return res.status(201).json(rows[0]);
});

router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  await pool.query('DELETE FROM enrollments WHERE id = ?', [req.params.id]);
  return res.status(204).send();
});

module.exports = { enrollmentsRoutes: router };
