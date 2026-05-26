const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyJWT } = require('../middleware/auth');

// SEARCH — fix SQL injection con query parametrizada
router.get('/search', verifyJWT, (req, res) => {
  const { name = '', role = '' } = req.query;

  db.all(
    'SELECT id, username, email, role FROM users WHERE username LIKE ? OR role = ?',
    [`%${name}%`, role],
    (err, rows) => {
      if (err) {
        console.error('search error:', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
      }
      res.json(rows);
    }
  );
});

// GET /:id — fix IDOR + password expuesto; requiere auth + ownership
router.get('/:id', verifyJWT, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID inválido' });

  // Solo el propio usuario o un admin puede ver el perfil
  if (req.user.id !== id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado' });
  }

  // Selecciona campos específicos — nunca devuelve password
  db.get(
    'SELECT id, username, email, role FROM users WHERE id = ?',
    [id],
    (err, row) => {
      if (err) {
        console.error('get user error:', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
      }
      if (!row) return res.status(404).json({ error: 'Usuario no encontrado' });
      res.json(row);
    }
  );
});

// DELETE /:id — requiere auth + solo admin o el propio usuario
router.delete('/:id', verifyJWT, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID inválido' });

  if (req.user.id !== id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado' });
  }

  db.run('DELETE FROM users WHERE id = ?', [id], function (err) {
    if (err) {
      console.error('delete user error:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    res.json({ deleted: this.changes });
  });
});

// PUT /:id — fix SQL injection + escalada de rol; requiere auth
router.put('/:id', verifyJWT, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID inválido' });

  if (req.user.id !== id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado' });
  }

  const { username, email, role } = req.body;

  if (!username || typeof username !== 'string' || username.trim().length === 0) {
    return res.status(400).json({ error: 'Nombre de usuario inválido' });
  }
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Email inválido' });
  }

  // Solo un admin puede cambiar el rol; ignorar para usuarios normales
  const VALID_ROLES = ['user', 'admin'];
  const newRole = req.user.role === 'admin' && role && VALID_ROLES.includes(role)
    ? role
    : undefined;

  if (newRole !== undefined) {
    db.run(
      'UPDATE users SET username = ?, email = ?, role = ? WHERE id = ?',
      [username.trim(), email.trim(), newRole, id],
      function (err) {
        if (err) {
          console.error('update user error:', err);
          return res.status(500).json({ error: 'Error interno del servidor' });
        }
        res.json({ updated: this.changes });
      }
    );
  } else {
    db.run(
      'UPDATE users SET username = ?, email = ? WHERE id = ?',
      [username.trim(), email.trim(), id],
      function (err) {
        if (err) {
          console.error('update user error:', err);
          return res.status(500).json({ error: 'Error interno del servidor' });
        }
        res.json({ updated: this.changes });
      }
    );
  }
});

module.exports = router;
