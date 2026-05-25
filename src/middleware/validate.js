function requireFields(...fields) {
  return (req, res, next) => {
    const missing = fields.filter(f => !req.body[f] && !req.query[f]);
    if (missing.length > 0) {
      return res.status(400).json({ error: `Campos requeridos: ${missing.join(', ')}` });
    }
    next();
  };
}

function parsePositiveInt(value, defaultValue) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : defaultValue;
}

module.exports = { requireFields, parsePositiveInt };
