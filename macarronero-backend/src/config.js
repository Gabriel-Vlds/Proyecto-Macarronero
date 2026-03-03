// Configuracion central del backend: puerto, DB, JWT y CORS.
require('dotenv').config();

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';

const config = {
  port: Number(process.env.PORT || 3000),
  
db: {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'macarronero',
  port: Number(process.env.DB_PORT || 3306),
},

  jwt: {
    secret: process.env.JWT_SECRET || 'dev_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  corsOrigin: process.env.CORS_ORIGIN || '*',
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    successUrl: process.env.STRIPE_SUCCESS_URL || `${frontendUrl}/courses?checkout=success`,
    cancelUrl: process.env.STRIPE_CANCEL_URL || `${frontendUrl}/courses?checkout=cancel`
  },
  mux: {
    tokenId: process.env.MUX_TOKEN_ID || '',
    tokenSecret: process.env.MUX_TOKEN_SECRET || '',
    signingKeyId: process.env.MUX_SIGNING_KEY_ID || '',
    signingKeyPrivate: process.env.MUX_SIGNING_KEY_PRIVATE || ''
  }
};

module.exports = { config };
