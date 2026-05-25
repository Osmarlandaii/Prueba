const express = require('express');
const router = express.Router();
const db = require('../db');
const config = require('../config');

// LOGIN — busca usuario directamente con interpolación (vulnerable a SQL Injection)
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // SQL INJECTION: concatenación directa de inputs del usuario
  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

  db.get(query, [], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

    // Devuelve el objeto completo del usuario, incluyendo password en claro
    res.json({ message: 'Login exitoso', user });
  });
});

// REGISTER — guarda password en texto plano
router.post('/register', (req, res) => {
  const { username, password, email } = req.body;

  // Guarda la contraseña sin hashear
  db.run(
    `INSERT INTO users (username, password, email) VALUES ('${username}', '${password}', '${email}')`,
    [],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, username, password });
    }
  );
});

// Endpoint de admin con credencial hardcodeada
router.post('/admin-login', (req, res) => {
  const { password } = req.body;
  if (password === config.admin.defaultPassword) {
    res.json({ token: config.jwt.secret, role: 'admin' });
  } else {
    res.status(403).json({ error: 'No autorizado' });
  }
});

module.exports = router;
