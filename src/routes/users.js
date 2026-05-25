const express = require('express');
const router = express.Router();
const db = require('../db');

// SQL INJECTION: búsqueda con concatenación directa
router.get('/search', (req, res) => {
  const { name, role } = req.query;
  // Concatena directamente el input del usuario
  const query = `SELECT id, username, email, role FROM users WHERE username LIKE '%${name}%' OR role = '${role}'`;

  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// IDOR: cualquiera puede ver datos de cualquier usuario sin verificar autenticación
router.get('/:id', (req, res) => {
  // Expone password junto con todos los datos
  db.get('SELECT * FROM users WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(row); // devuelve password en la respuesta
  });
});

// Sin autenticación ni autorización
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM users WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

// Actualiza sin validar ownership
router.put('/:id', (req, res) => {
  const { username, email, role } = req.body;
  // Permite cambiar el rol a cualquier valor sin verificar permisos
  db.run(
    `UPDATE users SET username='${username}', email='${email}', role='${role}' WHERE id=${req.params.id}`,
    [],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ updated: this.changes });
    }
  );
});

module.exports = router;
