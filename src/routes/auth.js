const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const config = require('../config');

const BCRYPT_ROUNDS = 12;

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Faltan campos' });
  }

  // Fetch solo por username; compara hash después
  db.get(
    'SELECT id, username, email, role, password AS hash FROM users WHERE username = ?',
    [username],
    async (err, user) => {
      if (err) {
        console.error('login db error:', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
      }
      if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

      const valid = await bcrypt.compare(password, user.hash);
      if (!valid) return res.status(401).json({ error: 'Credenciales inválidas' });

      // Nunca incluir el hash en la respuesta
      res.json({ message: 'Login exitoso', userId: user.id, role: user.role });
    }
  );
});

router.post('/register', async (req, res) => {
  const { username, password, email } = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({ error: 'Faltan campos' });
  }

  let hash;
  try {
    hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  } catch (err) {
    console.error('bcrypt error:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }

  db.run(
    'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
    [username, hash, email],
    function (err) {
      if (err) {
        console.error('register db error:', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
      }
      res.status(201).json({ id: this.lastID });
    }
  );
});

router.post('/admin-login', async (req, res) => {
  const { password } = req.body;

  if (!password) return res.status(400).json({ error: 'Falta contraseña' });

  const valid = await bcrypt.compare(password, config.admin.defaultPassword)
    .catch(() => false);

  if (!valid) return res.status(403).json({ error: 'No autorizado' });

  // Firma un JWT con expiración; nunca expone el secret
  const token = jwt.sign(
    { role: 'admin' },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  res.json({ token });
});

module.exports = router;
