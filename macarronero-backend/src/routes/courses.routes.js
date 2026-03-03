// Endpoints para cursos disponibles en la plataforma.
const express = require('express');
const { pool } = require('../db');
const { config } = require('../config');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

const COURSE_FIELDS = 'id, title, description, price, tier, level, cover_url, created_at, updated_at';

const DEMO_COURSE = {
  title: 'Curso Demo Macarronero',
  description: 'Curso de prueba para validar compra, acceso y experiencia protegida.',
  price: 19.99,
  tier: 'basic',
  level: 'beginner',
  coverUrl: null
};

function isMuxPlaybackUrl(url) {
  return typeof url === 'string' && /stream\.mux\.com\/.+\.(m3u8|mp4)/i.test(url);
}

async function createMuxPlaybackUrlFromSource(sourceUrl) {
  if (!config.mux.tokenId || !config.mux.tokenSecret) {
    return sourceUrl;
  }

  const auth = Buffer.from(`${config.mux.tokenId}:${config.mux.tokenSecret}`).toString('base64');
  const response = await fetch('https://api.mux.com/video/v1/assets', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      input: [{ url: sourceUrl }],
      playback_policy: ['public']
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Mux asset creation failed (${response.status}): ${body}`);
  }

  const payload = await response.json();
  const playbackId = payload?.data?.playback_ids?.[0]?.id;
  if (!playbackId) {
    throw new Error('Mux response without playback id');
  }

  return `https://stream.mux.com/${playbackId}.m3u8`;
}

// Lista todos los cursos (publico, sin contenido protegido)
router.get('/', async (req, res) => {
  let [rows] = await pool.query(`SELECT ${COURSE_FIELDS} FROM courses`);

  if (rows.length === 0) {
    const [insertResult] = await pool.query(
      'INSERT INTO courses (title, description, price, tier, level, cover_url) VALUES (?, ?, ?, ?, ?, ?)',
      [
        DEMO_COURSE.title,
        DEMO_COURSE.description,
        DEMO_COURSE.price,
        DEMO_COURSE.tier,
        DEMO_COURSE.level,
        DEMO_COURSE.coverUrl
      ]
    );

    await pool.query(
      'INSERT INTO lessons (course_id, title, content, order_index, duration_min) VALUES (?, ?, ?, ?, ?)',
      [
        insertResult.insertId,
        'Lección de prueba: Bienvenida',
        'Esta lección existe para validar el flujo de compra y visualización protegida.',
        1,
        8
      ]
    );

    [rows] = await pool.query(`SELECT ${COURSE_FIELDS} FROM courses WHERE id = ?`, [insertResult.insertId]);
  }

  return res.json(rows);
});

// Devuelve el detalle de un curso (publico — solo metadatos).
router.get('/:id', async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Courses detail error:', error);
    return res.status(500).json({ message: 'Server error loading course detail' });
  }
});

// Devuelve las lecciones de un curso. Requiere estar inscrito (o ser admin).
router.get('/:id/lessons', authenticate, async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Courses lessons error:', error);
    return res.status(500).json({ message: 'Server error loading lessons' });
  }
});

router.post('/:id/lessons', authenticate, requireRole('admin'), async (req, res) => {
  const courseId = Number(req.params.id);
  if (!courseId) return res.status(400).json({ message: 'Invalid course id' });

  const { title, content, videoUrl, orderIndex, durationMin } = req.body;
  if (!title) {
    return res.status(400).json({ message: 'Missing lesson title' });
  }

  const [courseRows] = await pool.query('SELECT id FROM courses WHERE id = ?', [courseId]);
  if (courseRows.length === 0) {
    return res.status(404).json({ message: 'Course not found' });
  }

  const order = Number(orderIndex);
  const duration = durationMin == null || durationMin === '' ? null : Number(durationMin);
  let finalVideoUrl = videoUrl || null;

  if (finalVideoUrl && !isMuxPlaybackUrl(finalVideoUrl) && config.mux.tokenId && config.mux.tokenSecret) {
    try {
      finalVideoUrl = await createMuxPlaybackUrlFromSource(finalVideoUrl);
    } catch (error) {
      console.error('Mux processing error:', error);
      return res.status(500).json({ message: 'No se pudo procesar el video en Mux.' });
    }
  }

  const [result] = await pool.query(
    `INSERT INTO lessons (course_id, title, content, video_url, order_index, duration_min)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      courseId,
      title,
      content || '',
      finalVideoUrl,
      Number.isFinite(order) && order > 0 ? order : 1,
      Number.isFinite(duration) && duration > 0 ? duration : null
    ]
  );

  const [rows] = await pool.query(
    'SELECT id, title, content, video_url, order_index, duration_min FROM lessons WHERE id = ?',
    [result.insertId]
  );

  return res.status(201).json(rows[0]);
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

