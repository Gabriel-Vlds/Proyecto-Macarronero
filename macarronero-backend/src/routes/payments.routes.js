// Checkout y webhook de Stripe para pagos unicos (cursos y kits).
const express = require('express');
const { pool } = require('../db');
const { config } = require('../config');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const stripe = config.stripe.secretKey ? require('stripe')(config.stripe.secretKey) : null;

function appendQueryParams(baseUrl, params) {
  try {
    const parsed = new URL(baseUrl);
    for (const [key, value] of Object.entries(params)) {
      parsed.searchParams.set(key, String(value));
    }
    return parsed.toString();
  } catch {
    return baseUrl;
  }
}

/**
 * Crea una sesion de Stripe Checkout para comprar un curso o kit.
 * Body: { type: 'course' | 'kit', itemId: number, quantity?: number }
 */
router.post('/checkout', authenticate, async (req, res) => {
  if (!stripe) {
    return res.status(503).json({
      message: 'Stripe no esta configurado. Define STRIPE_SECRET_KEY (modo prueba) en Render.'
    });
  }

  const { type, itemId, quantity = 1 } = req.body;
  if (!type || !itemId) {
    return res.status(400).json({ message: 'Missing type or itemId' });
  }

  const qty = Math.max(1, Number(quantity));
  let name, price, metadata;

  if (type === 'course') {
    const [rows] = await pool.query('SELECT id, title, price FROM courses WHERE id = ?', [itemId]);
    if (!rows.length) return res.status(404).json({ message: 'Course not found' });

    // Verificar si ya esta inscrito
    const [enrolled] = await pool.query(
      'SELECT id FROM enrollments WHERE user_id = ? AND course_id = ? LIMIT 1',
      [req.user.id, itemId]
    );
    if (enrolled.length > 0) {
      return res.status(409).json({ message: 'Ya compraste este curso' });
    }

    name = rows[0].title;
    price = Math.round(Number(rows[0].price) * 100); // centavos
    metadata = { type: 'course', itemId: String(itemId), userId: String(req.user.id), quantity: '1' };
  } else if (type === 'kit') {
    const [rows] = await pool.query('SELECT id, name, price, stock FROM kits WHERE id = ?', [itemId]);
    if (!rows.length) return res.status(404).json({ message: 'Kit not found' });
    if (rows[0].stock < qty) return res.status(409).json({ message: 'Stock insuficiente' });

    name = rows[0].name;
    price = Math.round(Number(rows[0].price) * 100);
    metadata = { type: 'kit', itemId: String(itemId), userId: String(req.user.id), quantity: String(qty) };
  } else {
    return res.status(400).json({ message: 'type debe ser course o kit' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        quantity: qty,
        price_data: {
          currency: 'usd',
          unit_amount: price,
          product_data: { name }
        }
      }],
      success_url: appendQueryParams(config.stripe.successUrl, { type, itemId }),
      cancel_url: appendQueryParams(config.stripe.cancelUrl, { type, itemId }),
      metadata,
      client_reference_id: String(req.user.id)
    });

    return res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return res.status(500).json({ message: 'Stripe session failed' });
  }
});

/**
 * Webhook de Stripe para confirmar pagos completados.
 */
router.post('/webhook', async (req, res) => {
  if (!stripe || !config.stripe.webhookSecret) {
    return res.status(500).send('Stripe webhook not configured');
  }

  const signature = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, config.stripe.webhookSecret);
  } catch (error) {
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // Solo procesamos pagos unicos
    if (session.mode !== 'payment') return res.json({ received: true });

    const { type, itemId, userId, quantity } = session.metadata || {};
    const uid = Number(userId);
    const iid = Number(itemId);
    const qty = Math.max(1, Number(quantity || 1));

    if (!type || !iid || !uid) {
      console.error('Webhook: metadata incompleta', session.metadata);
      return res.status(400).send('Missing metadata');
    }

    try {
      if (type === 'course') {
        // Insertar inscripcion (ignorar duplicado)
        await pool.query(
          `INSERT IGNORE INTO enrollments (user_id, course_id) VALUES (?, ?)`,
          [uid, iid]
        );
      } else if (type === 'kit') {
        const [kitRows] = await pool.query('SELECT price, stock FROM kits WHERE id = ?', [iid]);
        if (kitRows.length > 0) {
          const totalPrice = Number(kitRows[0].price) * qty;
          await pool.query('UPDATE kits SET stock = stock - ? WHERE id = ?', [qty, iid]);
          await pool.query(
            'INSERT INTO kit_purchases (user_id, kit_id, quantity, total_price) VALUES (?, ?, ?, ?)',
            [uid, iid, qty, totalPrice]
          );
        }
      }
    } catch (err) {
      console.error('Webhook DB error:', err);
      return res.status(500).send('DB error');
    }
  }

  return res.json({ received: true });
});

module.exports = { paymentsRoutes: router };
