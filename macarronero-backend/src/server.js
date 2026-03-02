// Punto de entrada del servidor Express y montaje de rutas principales.
const express = require('express');
const cors = require('cors');
const { config } = require('./config');
const { authRoutes } = require('./routes/auth.routes');
const { usersRoutes } = require('./routes/users.routes');
const { coursesRoutes } = require('./routes/courses.routes');
const { kitsRoutes } = require('./routes/kits.routes');
const { enrollmentsRoutes } = require('./routes/enrollments.routes');
const { purchasesRoutes } = require('./routes/purchases.routes');
const { paymentsRoutes } = require('./routes/payments.routes');
const { subscriptionsRoutes } = require('./routes/subscriptions.routes');

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/kits', kitsRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/enrollments', enrollmentsRoutes);
app.use('/api/purchases', purchasesRoutes);
app.use('/api/payments', paymentsRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Server error' });
});

app.listen(config.port, () => {
  console.log(`API running on http://localhost:${config.port}`);
});
