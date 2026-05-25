const express = require('express');
const router = express.Router();
const db = require('../db');
const { parsePositiveInt } = require('../middleware/validate');

const MAX_PAGE_SIZE = 50;

router.get('/', (req, res) => {
  const page = parsePositiveInt(req.query.page, 1);
  const limit = Math.min(parsePositiveInt(req.query.limit, 10), MAX_PAGE_SIZE);
  const offset = (page - 1) * limit;

  db.get('SELECT COUNT(*) as total FROM products', [], (err, countRow) => {
    if (err) return res.status(500).json({ error: 'Error al obtener productos' });

    db.all(
      'SELECT id, name, description, price, stock FROM products LIMIT ? OFFSET ?',
      [limit, offset],
      (err2, rows) => {
        if (err2) return res.status(500).json({ error: 'Error al obtener productos' });
        res.json({
          data: rows,
          meta: { page, limit, total: countRow.total },
        });
      }
    );
  });
});

router.post('/', (req, res) => {
  const { name, description, price, stock } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Nombre requerido' });
  }
  if (price == null || isNaN(Number(price)) || Number(price) < 0) {
    return res.status(400).json({ error: 'Precio inválido' });
  }
  if (stock == null || !Number.isInteger(Number(stock)) || Number(stock) < 0) {
    return res.status(400).json({ error: 'Stock inválido' });
  }

  db.run(
    'INSERT INTO products (name, description, price, stock) VALUES (?, ?, ?, ?)',
    [name.trim(), description || '', Number(price), Number(stock)],
    function (err) {
      if (err) return res.status(500).json({ error: 'Error al crear producto' });
      res.status(201).json({ id: this.lastID });
    }
  );
});

router.get('/:id', (req, res) => {
  const id = parsePositiveInt(req.params.id, null);
  if (!id) return res.status(400).json({ error: 'ID inválido' });

  db.get(
    'SELECT id, name, description, price, stock FROM products WHERE id = ?',
    [id],
    (err, row) => {
      if (err) return res.status(500).json({ error: 'Error al obtener producto' });
      if (!row) return res.status(404).json({ error: 'Producto no encontrado' });
      res.json(row);
    }
  );
});

router.put('/:id', (req, res) => {
  const id = parsePositiveInt(req.params.id, null);
  if (!id) return res.status(400).json({ error: 'ID inválido' });

  const { name, description, price, stock } = req.body;

  if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
    return res.status(400).json({ error: 'Nombre inválido' });
  }
  if (price !== undefined && (isNaN(Number(price)) || Number(price) < 0)) {
    return res.status(400).json({ error: 'Precio inválido' });
  }

  db.run(
    `UPDATE products SET
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      price = COALESCE(?, price),
      stock = COALESCE(?, stock)
     WHERE id = ?`,
    [name?.trim() ?? null, description ?? null, price != null ? Number(price) : null, stock != null ? Number(stock) : null, id],
    function (err) {
      if (err) return res.status(500).json({ error: 'Error al actualizar producto' });
      if (this.changes === 0) return res.status(404).json({ error: 'Producto no encontrado' });
      res.json({ updated: true });
    }
  );
});

module.exports = router;
