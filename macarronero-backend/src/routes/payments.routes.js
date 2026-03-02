// Checkout y webhook de Stripe para pagos unicos (cursos y kits).
const express = require('express');
const { pool } = require('../db');
const { config } = require('../config');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const stripe = config.stripe.secretKey ? require('stripe')(config.stripe.secretKey) : null;

/**
 * Crea una sesion de Stripe Checkout para comprar un curso o kit.
 * Body: { type: 'course' | 'kit', itemId: number, quantity?: number }
 */
router.post('/checkout', authenticate, async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ message: 'Stripe is not configured' });
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
      success_url: `${config.stripe.successUrl}&type=${type}&itemId=${itemId}`,
      cancel_url: config.stripe.cancelUrl,
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


/**
 * Webhook de Stripe.
 * Maneja: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted
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

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      // Solo procesamos sesiones de suscripcion
      if (session.mode !== 'subscription') {
        return res.json({ received: true });
      }

      const userId = Number(session?.metadata?.userId || 0);
      const plan = session?.metadata?.plan;
      const stripeCustomerId = session.customer;
      const stripeSubscriptionId = session.subscription;

      if (!userId || !plan) {
        return res.status(400).send('Missing metadata');
      }

      // Obtiene datos del periodo desde la suscripcion de Stripe
      let periodStart = null;
      let periodEnd = null;

      if (stripeSubscriptionId) {
        try {
          const stripeSub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
          if (stripeSub.current_period_start) {
            periodStart = new Date(stripeSub.current_period_start * 1000)
              .toISOString().slice(0, 19).replace('T', ' ');
          }
          if (stripeSub.current_period_end) {
            periodEnd = new Date(stripeSub.current_period_end * 1000)
              .toISOString().slice(0, 19).replace('T', ' ');
          }
        } catch (retrieveErr) {
          console.error('Could not retrieve Stripe subscription dates:', retrieveErr.message);
        }
      }

      await pool.query(
        `INSERT INTO subscriptions
          (user_id, plan, status, stripe_subscription_id, stripe_customer_id,
           current_period_start, current_period_end)
         VALUES (?, ?, 'active', ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           status = 'active',
           stripe_customer_id = VALUES(stripe_customer_id),
           current_period_start = VALUES(current_period_start),
           current_period_end = VALUES(current_period_end),
           updated_at = NOW()`,
        [userId, plan, stripeSubscriptionId, stripeCustomerId, periodStart, periodEnd]
      );
    }

    if (event.type === 'customer.subscription.created') {
      const stripeSub = event.data.object;
      if (stripeSub.current_period_start && stripeSub.current_period_end) {
        const periodStart = new Date(stripeSub.current_period_start * 1000)
          .toISOString().slice(0, 19).replace('T', ' ');
        const periodEnd = new Date(stripeSub.current_period_end * 1000)
          .toISOString().slice(0, 19).replace('T', ' ');
        await pool.query(
          `UPDATE subscriptions
           SET current_period_start = ?, current_period_end = ?, updated_at = NOW()
           WHERE stripe_subscription_id = ? AND (current_period_start IS NULL OR current_period_end IS NULL)`,
          [periodStart, periodEnd, stripeSub.id]
        );
      }
    }

    if (event.type === 'customer.subscription.updated') {
      const stripeSub = event.data.object;
      const periodStart = stripeSub.current_period_start
        ? new Date(stripeSub.current_period_start * 1000).toISOString().slice(0, 19).replace('T', ' ')
        : null;
      const periodEnd = stripeSub.current_period_end
        ? new Date(stripeSub.current_period_end * 1000).toISOString().slice(0, 19).replace('T', ' ')
        : null;
      const status = stripeSub.status === 'active' ? 'active' : 'expired';

      await pool.query(
        `UPDATE subscriptions
         SET status = ?, current_period_start = ?, current_period_end = ?, updated_at = NOW()
         WHERE stripe_subscription_id = ?`,
        [status, periodStart, periodEnd, stripeSub.id]
      );
    }

    if (event.type === 'customer.subscription.deleted') {
      const stripeSub = event.data.object;

      await pool.query(
        `UPDATE subscriptions SET status = 'expired', updated_at = NOW()
         WHERE stripe_subscription_id = ?`,
        [stripeSub.id]
      );
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).send('Webhook processing failed');
  }

  return res.json({ received: true });
});

module.exports = { paymentsRoutes: router };
