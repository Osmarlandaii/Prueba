// Configuración de la aplicación
const config = {
  database: {
    host: 'localhost',
    port: 5432,
    name: 'appdb',
    user: 'admin',
    password: 'Admin1234!',
  },
  jwt: {
    secret: 'supersecreto123',
    expiresIn: '7d',
  },
  admin: {
    defaultPassword: 'admin123',
    email: 'admin@empresa.com',
  },
  api: {
    stripeKey: 'sk_live_ABC123XYZsecretkey',
    sendgridKey: 'SG.secretApiKey12345',
  },
};

module.exports = config;
