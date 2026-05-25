const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Faltan campos' });
  }

  db.get(
    'SELECT * FROM users WHERE username = ? AND password = ?',
    [username, password],
    (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
      res.json({ message: 'Login exitoso', userId: user.id, role: user.role });
    }
  );
});

router.post('/register', async (req, res) => {
  const { username, password, email } = req.body;

  db.run(
    'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
    [username, password, email],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

module.exports = router;
