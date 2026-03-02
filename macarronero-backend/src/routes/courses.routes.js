// Endpoints para cursos disponibles en la plataforma.
const express = require('express');
const { pool } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

const COURSE_FIELDS = 'id, title, description, price, tier, level, cover_url, created_at, updated_at';

// Lista todos los cursos (publico, sin contenido protegido)
router.get('/', async (req, res) => {
  const [rows] = await pool.query(`SELECT ${COURSE_FIELDS} FROM courses`);
  return res.json(rows);
});

// Devuelve el detalle de un curso (publico — solo metadatos).
router.get('/:id', async (req, res) => {
  const courseId = Number(req.params.id);
  if (!courseId) return res.status(400).json({ message: 'Invalid course id' });

  const [courseRows] = await pool.query(
    `SELECT ${COURSE_FIELDS} FROM courses WHERE id = ?`,
    [courseId]
  );

  if (courseRows.length === 0) {
    return res.status(404).json({ message: 'Course not found' });
  }

  return res.json(courseRows[0]);
});

// Devuelve las lecciones de un curso. Requiere estar inscrito (o ser admin).
router.get('/:id/lessons', authenticate, async (req, res) => {
  const courseId = Number(req.params.id);
  if (!courseId) return res.status(400).json({ message: 'Invalid course id' });

  const [courseRows] = await pool.query('SELECT id FROM courses WHERE id = ?', [courseId]);
  if (courseRows.length === 0) return res.status(404).json({ message: 'Course not found' });

  if (req.user.role !== 'admin') {
    const [enrollRows] = await pool.query(
      'SELECT id FROM enrollments WHERE user_id = ? AND course_id = ? LIMIT 1',
      [req.user.id, courseId]
    );
    if (enrollRows.length === 0) {
      return res.status(403).json({ message: 'Necesitas comprar este curso para acceder.' });
    }
  }

  const [lessons] = await pool.query(
    'SELECT id, title, content, video_url, order_index, duration_min FROM lessons WHERE course_id = ? ORDER BY order_index ASC',
    [courseId]
  );

  return res.json(lessons);
});

router.post('/', authenticate, requireRole('admin'), async (req, res) => {
  const { title, description, price, tier, level, coverUrl } = req.body;

  if (!title || price == null) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  const [result] = await pool.query(
    'INSERT INTO courses (title, description, price, tier, level, cover_url) VALUES (?, ?, ?, ?, ?, ?)',
    [title, description || '', price, tier || 'basic', level || 'beginner', coverUrl || null]
  );

  const [rows] = await pool.query(
    `SELECT ${COURSE_FIELDS} FROM courses WHERE id = ?`,
    [result.insertId]
  );

  return res.status(201).json(rows[0]);
});

router.patch('/:id', authenticate, requireRole('admin'), async (req, res) => {
  const { title, description, price, tier, level, coverUrl } = req.body;
  const updates = [];
  const values = [];

  if (title) {
    updates.push('title = ?');
    values.push(title);
  }
  if (description != null) {
    updates.push('description = ?');
    values.push(description);
  }
  if (price != null) {
    updates.push('price = ?');
    values.push(price);
  }
  if (tier) {
    updates.push('tier = ?');
    values.push(tier);
  }
  if (level) {
    updates.push('level = ?');
    values.push(level);
  }
  if (coverUrl !== undefined) {
    updates.push('cover_url = ?');
    values.push(coverUrl);
  }

  if (updates.length === 0) {
    return res.status(400).json({ message: 'No updates provided' });
  }

  values.push(req.params.id);
  await pool.query(`UPDATE courses SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`, values);

  const [rows] = await pool.query(
    `SELECT ${COURSE_FIELDS} FROM courses WHERE id = ?`,
    [req.params.id]
  );

  return res.json(rows[0]);
});

router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  await pool.query('DELETE FROM courses WHERE id = ?', [req.params.id]);
  return res.status(204).send();
});

module.exports = { coursesRoutes: router };

