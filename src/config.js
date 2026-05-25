const REQUIRED_VARS = [
  'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD',
  'JWT_SECRET', 'JWT_EXPIRES_IN',
  'ADMIN_DEFAULT_PASSWORD', 'ADMIN_EMAIL',
  'STRIPE_KEY', 'SENDGRID_KEY',
];

const missing = REQUIRED_VARS.filter(v => !process.env[v]);
if (missing.length > 0) {
  throw new Error(`Variables de entorno requeridas no definidas: ${missing.join(', ')}`);
}

const config = {
  database: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
  },
  admin: {
    defaultPassword: process.env.ADMIN_DEFAULT_PASSWORD,
    email: process.env.ADMIN_EMAIL,
  },
  api: {
    stripeKey: process.env.STRIPE_KEY,
    sendgridKey: process.env.SENDGRID_KEY,
  },
};

module.exports = config;
