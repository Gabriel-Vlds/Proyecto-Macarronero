// Endpoints para cursos disponibles en la plataforma.
const express = require('express');
const jwt = require('jsonwebtoken');
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

function getMuxPlaybackIdFromUrl(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const match = url.match(/stream\.mux\.com\/([^.?/]+)/i);
  return match?.[1] ?? null;
}

function getMuxAuthHeader() {
  if (!config.mux.tokenId || !config.mux.tokenSecret) {
    return null;
  }

  return `Basic ${Buffer.from(`${config.mux.tokenId}:${config.mux.tokenSecret}`).toString('base64')}`;
}

async function muxApiRequest(path, options = {}) {
  const authHeader = getMuxAuthHeader();
  if (!authHeader) {
    throw new Error('Mux credentials are not configured');
  }

  const response = await fetch(`https://api.mux.com/video/v1${path}`, {
    method: options.method || 'GET',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    const bodyText = await response.text();
    throw new Error(`Mux API error ${response.status}: ${bodyText}`);
  }

  return response.json();
}

function getMuxSigningPrivateKey() {
  if (!config.mux.signingKeyPrivate) {
    return null;
  }

  return config.mux.signingKeyPrivate.replace(/\\n/g, '\n');
}

function createMuxPlaybackToken(playbackId, user) {
  if (!playbackId || !config.mux.signingKeyId) {
    return null;
  }

  const privateKey = getMuxSigningPrivateKey();
  if (!privateKey) {
    return null;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const payload = {
    sub: playbackId,
    aud: 'v',
    exp: nowSeconds + 60 * 10,
    user_id: user?.id || undefined,
    user_email: user?.email || undefined
  };

  return jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    keyid: config.mux.signingKeyId
  });
}

async function getMuxAssetInfoByPlaybackId(playbackId) {
  const authHeader = getMuxAuthHeader();
  if (!authHeader) {
    return { status: 'unknown', signedPlaybackId: null };
  }

  const playbackResponse = await fetch(`https://api.mux.com/video/v1/playback-ids/${playbackId}`, {
    headers: {
      Authorization: authHeader
    }
  });

  if (!playbackResponse.ok) {
    return { status: 'unknown', signedPlaybackId: null };
  }

  const playbackPayload = await playbackResponse.json();
  const assetId = playbackPayload?.data?.object?.id;
  if (!assetId) {
    return { status: 'unknown', signedPlaybackId: null };
  }

  const assetResponse = await fetch(`https://api.mux.com/video/v1/assets/${assetId}`, {
    headers: {
      Authorization: authHeader
    }
  });

  if (!assetResponse.ok) {
    return { status: 'unknown', signedPlaybackId: null };
  }

  const assetPayload = await assetResponse.json();
  const signedPlaybackId = assetPayload?.data?.playback_ids?.find((item) => item.policy === 'signed')?.id || null;

  return {
    status: assetPayload?.data?.status || 'unknown',
    signedPlaybackId
  };
}

async function enrichLessonWithMuxStatus(lesson, user) {
  const playbackId = getMuxPlaybackIdFromUrl(lesson.video_url);
  if (!playbackId) {
    return {
      ...lesson,
      mux_playback_id: null,
      mux_signed_playback_id: null,
      mux_playback_token: null,
      mux_status: null
    };
  }

  try {
    const assetInfo = await getMuxAssetInfoByPlaybackId(playbackId);
    const playbackToken = assetInfo.signedPlaybackId ? createMuxPlaybackToken(assetInfo.signedPlaybackId, user) : null;

    return {
      ...lesson,
      mux_playback_id: playbackId,
      mux_signed_playback_id: assetInfo.signedPlaybackId,
      mux_playback_token: playbackToken,
      mux_status: assetInfo.status
    };
  } catch (error) {
    console.error('Mux status read error:', error);
    return {
      ...lesson,
      mux_playback_id: playbackId,
      mux_signed_playback_id: null,
      mux_playback_token: null,
      mux_status: 'unknown'
    };
  }
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
      playback_policy: ['public', 'signed']
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
  const startedAt = Date.now();

  try {
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

    console.info(`[courses:list] ok count=${rows.length} durationMs=${Date.now() - startedAt}`);
    return res.json(rows);
  } catch (error) {
    console.error(`[courses:list] error durationMs=${Date.now() - startedAt}`, error);
    return res.status(500).json({ message: 'Server error loading courses' });
  }
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

    const lessonsWithStatus = await Promise.all(lessons.map((lesson) => enrichLessonWithMuxStatus(lesson, req.user)));
    return res.json(lessonsWithStatus);
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

router.post('/:id/lessons/mux-upload', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const courseId = Number(req.params.id);
    if (!courseId) {
      return res.status(400).json({ message: 'Invalid course id' });
    }

    const [courseRows] = await pool.query('SELECT id FROM courses WHERE id = ?', [courseId]);
    if (courseRows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (!config.mux.tokenId || !config.mux.tokenSecret) {
      return res.status(500).json({ message: 'Mux no esta configurado en el servidor.' });
    }

    const { fileName, contentType } = req.body || {};
    const origin = typeof req.headers.origin === 'string' && req.headers.origin ? req.headers.origin : undefined;

    const payload = await muxApiRequest('/uploads', {
      method: 'POST',
      body: {
        cors_origin: origin,
        timeout: 3600,
        new_asset_settings: {
          playback_policy: ['public', 'signed'],
          mp4_support: 'standard',
          passthrough: JSON.stringify({
            courseId,
            fileName: typeof fileName === 'string' ? fileName : null,
            contentType: typeof contentType === 'string' ? contentType : null
          })
        }
      }
    });

    return res.status(201).json({
      uploadId: payload?.data?.id || null,
      uploadUrl: payload?.data?.url || null,
      status: payload?.data?.status || 'waiting',
      timeout: payload?.data?.timeout || 3600
    });
  } catch (error) {
    console.error('Mux upload creation error:', error);
    return res.status(500).json({ message: 'No se pudo crear la carga en Mux.' });
  }
});

router.get('/:id/lessons/mux-upload/:uploadId', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const courseId = Number(req.params.id);
    if (!courseId) {
      return res.status(400).json({ message: 'Invalid course id' });
    }

    const [courseRows] = await pool.query('SELECT id FROM courses WHERE id = ?', [courseId]);
    if (courseRows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const uploadId = String(req.params.uploadId || '').trim();
    if (!uploadId) {
      return res.status(400).json({ message: 'Invalid upload id' });
    }

    const uploadPayload = await muxApiRequest(`/uploads/${encodeURIComponent(uploadId)}`);
    const uploadData = uploadPayload?.data || {};
    const assetId = uploadData.asset_id || null;

    if (!assetId) {
      return res.json({
        uploadId,
        status: uploadData.status || 'waiting',
        muxStatus: 'preparing',
        assetId: null,
        playbackId: null,
        videoUrl: null
      });
    }

    const assetPayload = await muxApiRequest(`/assets/${encodeURIComponent(assetId)}`);
    const assetData = assetPayload?.data || {};
    const playbackId = assetData?.playback_ids?.[0]?.id || null;

    return res.json({
      uploadId,
      status: uploadData.status || 'asset_created',
      muxStatus: assetData.status || 'unknown',
      assetId,
      playbackId,
      videoUrl: playbackId ? `https://stream.mux.com/${playbackId}.m3u8` : null
    });
  } catch (error) {
    console.error('Mux upload status error:', error);
    return res.status(500).json({ message: 'No se pudo consultar el estado de la carga en Mux.' });
  }
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

