// Utilidades para firmar y validar tokens JWT.
const jwt = require('jsonwebtoken');
const { config } = require('../config');

const signToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  };

  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
};

module.exports = { signToken };
