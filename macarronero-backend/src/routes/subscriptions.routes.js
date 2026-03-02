// Endpoints para gestion de suscripciones (normal y premium).
const express = require('express');
const { pool } = require('../db');
const { authenticate } = require('../middleware/auth');
const { config } = require('../config');

const router = express.Router();

const stripe = config.stripe.secretKey ? require('stripe')(config.stripe.secretKey) : null;

/**
 * Devuelve la suscripcion activa del usuario autenticado.
 * Incluye la seleccion de curso premium del periodo actual si aplica.
 */
router.get('/me', authenticate, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id, plan, status, stripe_subscription_id, stripe_customer_id,
            current_period_start, current_period_end, created_at
     FROM subscriptions
     WHERE user_id = ? AND status = 'active'
       AND (current_period_end > NOW() OR current_period_end IS NULL)
     ORDER BY created_at DESC LIMIT 1`,
    [req.user.id]
  );

  if (rows.length === 0) {
    return res.json({ subscription: null });
  }

  const subscription = rows[0];

  if (subscription.plan === 'premium') {
    const periodStart = subscription.current_period_start
      ? new Date(subscription.current_period_start).toISOString().slice(0, 10)
      : null;

    const [selRows] = await pool.query(
      `SELECT ps.course_id, c.title, c.level, c.cover_url
       FROM premium_selections ps
       JOIN courses c ON c.id = ps.course_id
       WHERE ps.user_id = ? AND ps.period_start = ?`,
      [req.user.id, periodStart]
    );

    subscription.premiumSelection = selRows.length > 0 ? selRows[0] : null;
  }

  return res.json({ subscription });
});

/**
 * Crea una sesion de Stripe Checkout para suscribirse a un plan.
 * Body: { plan: 'normal' | 'premium' }
 */
router.post('/checkout', authenticate, async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ message: 'Stripe is not configured' });
  }

  const { plan } = req.body;
  if (plan !== 'normal' && plan !== 'premium') {
    return res.status(400).json({ message: 'Invalid plan. Use normal or premium' });
  }

  const priceId = config.stripe.plans[plan];
  if (!priceId) {
    return res.status(500).json({ message: `Stripe price for plan "${plan}" is not configured` });
  }

  const [existing] = await pool.query(
    `SELECT id FROM subscriptions
     WHERE user_id = ? AND status = 'active' AND current_period_end > NOW() LIMIT 1`,
    [req.user.id]
  );

  if (existing.length > 0) {
    return res.status(409).json({ message: 'You already have an active subscription' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${config.stripe.successUrl}&plan=${plan}`,
      cancel_url: config.stripe.cancelUrl,
      metadata: {
        userId: String(req.user.id),
        plan
      },
      client_reference_id: String(req.user.id)
    });

    return res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return res.status(500).json({ message: 'Stripe session failed' });
  }
});

/**
 * Cancela la suscripcion activa del usuario al final del periodo en Stripe.
 */
router.post('/cancel', authenticate, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id, stripe_subscription_id FROM subscriptions
     WHERE user_id = ? AND status = 'active' AND current_period_end > NOW() LIMIT 1`,
    [req.user.id]
  );

  if (rows.length === 0) {
    return res.status(404).json({ message: 'No active subscription found' });
  }

  const sub = rows[0];

  if (stripe && sub.stripe_subscription_id) {
    try {
      await stripe.subscriptions.update(sub.stripe_subscription_id, {
        cancel_at_period_end: true
      });
    } catch (error) {
      console.error('Stripe cancel error:', error);
      return res.status(500).json({ message: 'Failed to cancel subscription in Stripe' });
    }
  }

  await pool.query(
    `UPDATE subscriptions SET status = 'cancelled', updated_at = NOW() WHERE id = ?`,
    [sub.id]
  );

  return res.json({ message: 'Subscription cancelled. Access remains until end of period.' });
});

/**
 * Selecciona o cambia el curso premium del periodo actual.
 * Solo disponible para suscriptores premium activos.
 * Body: { courseId: number }
 */
router.post('/select-course', authenticate, async (req, res) => {
  const courseId = Number(req.body.courseId);
  if (!courseId) {
    return res.status(400).json({ message: 'Missing courseId' });
  }

  const [subRows] = await pool.query(
    `SELECT id, current_period_start FROM subscriptions
     WHERE user_id = ? AND plan = 'premium' AND status = 'active' AND current_period_end > NOW()
     LIMIT 1`,
    [req.user.id]
  );

  if (subRows.length === 0) {
    return res.status(403).json({ message: 'Active premium subscription required' });
  }

  const periodStart = subRows[0].current_period_start
    ? new Date(subRows[0].current_period_start).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  const [courseRows] = await pool.query(
    `SELECT id, title, level, cover_url FROM courses WHERE id = ? AND tier = 'premium'`,
    [courseId]
  );

  if (courseRows.length === 0) {
    return res.status(404).json({ message: 'Premium course not found' });
  }

  await pool.query(
    `INSERT INTO premium_selections (user_id, course_id, period_start)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE course_id = VALUES(course_id)`,
    [req.user.id, courseId, periodStart]
  );

  return res.json({
    message: 'Premium course selected',
    course: courseRows[0],
    periodStart
  });
});

module.exports = { subscriptionsRoutes: router };
