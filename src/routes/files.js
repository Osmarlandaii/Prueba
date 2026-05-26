const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { verifyJWT } = require('../middleware/auth');

const BASE_DIR = path.resolve(path.join(__dirname, '../../uploads'));

// Utilidad: escapa HTML para prevenir XSS reflejado
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Utilidad: valida que un path resuelto esté dentro de BASE_DIR
function isSafePath(resolvedPath) {
  return resolvedPath.startsWith(BASE_DIR + path.sep) || resolvedPath === BASE_DIR;
}

// DOWNLOAD — fix path traversal
router.get('/download', verifyJWT, (req, res) => {
  const filename = req.query.file;

  if (!filename) return res.status(400).json({ error: 'Falta el parámetro file' });

  // Rechaza paths con '..' o absolutos antes de resolver
  if (filename.includes('..') || path.isAbsolute(filename)) {
    return res.status(400).json({ error: 'Path inválido' });
  }

  const filePath = path.resolve(path.join(BASE_DIR, filename));

  if (!isSafePath(filePath)) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.error('download error:', err);
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }
    // Usa solo el basename en Content-Disposition
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filename)}"`);
    res.send(data);
  });
});

// SEARCH — fix XSS reflejado
router.get('/search', verifyJWT, (req, res) => {
  const query = req.query.q || '';
  const safeQuery = escapeHtml(query);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`
    <html>
      <body>
        <h1>Resultados para: ${safeQuery}</h1>
        <p>No se encontraron archivos que coincidan con &quot;${safeQuery}&quot;</p>
        <input id="search" value="${safeQuery}" />
      </body>
    </html>
  `);
});

// LIST — fix arbitrary filesystem listing
router.get('/list', verifyJWT, (req, res) => {
  const requestedSubpath = req.query.path || '';

  // Rechaza paths absolutos o con '..'
  if (path.isAbsolute(requestedSubpath) || requestedSubpath.includes('..')) {
    return res.status(400).json({ error: 'Path inválido' });
  }

  const targetDir = path.resolve(path.join(BASE_DIR, requestedSubpath));

  if (!isSafePath(targetDir)) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }

  fs.readdir(targetDir, { withFileTypes: true }, (err, entries) => {
    if (err) {
      console.error('list error:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    res.json({
      path: requestedSubpath || '/',
      entries: entries.map(e => ({ name: e.name, isDir: e.isDirectory() })),
    });
  });
});

// DELETE — fix IDOR + path traversal; requiere auth
router.delete('/delete', verifyJWT, (req, res) => {
  const filename = req.query.file;

  if (!filename) return res.status(400).json({ error: 'Falta el parámetro file' });

  if (filename.includes('..') || path.isAbsolute(filename)) {
    return res.status(400).json({ error: 'Path inválido' });
  }

  const filePath = path.resolve(path.join(BASE_DIR, filename));

  if (!isSafePath(filePath)) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }

  fs.unlink(filePath, (err) => {
    if (err) {
      console.error('delete error:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    res.json({ deleted: path.basename(filename) });
  });
});

module.exports = router;
