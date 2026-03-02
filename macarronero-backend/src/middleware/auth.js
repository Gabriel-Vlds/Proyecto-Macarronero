// Middleware para validar JWT y proteger rutas privadas.
const jwt = require('jsonwebtoken');
const { config } = require('../config');

const authenticate = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Missing token' });
  }

  try {
    const payload = jwt.verify(token, config.jwt.secret);
    req.user = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const requireRole = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  return next();
};

const requireSelfOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  if (req.user.role === 'admin') {
    return next();
  }

  const paramId = Number(req.params.id || 0);
  if (paramId && req.user.id === paramId) {
    return next();
  }

  return res.status(403).json({ message: 'Forbidden' });
};

module.exports = { authenticate, requireRole, requireSelfOrAdmin };
