const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const BASE_DIR = path.join(__dirname, '../../uploads');

// PATH TRAVERSAL: el usuario puede leer cualquier archivo del sistema
// con ../../etc/passwd u otros paths relativos
router.get('/download', (req, res) => {
  const filename = req.query.file;
  // Sin validación ni sanitización del path — vulnerable a path traversal
  const filePath = path.join(BASE_DIR, filename);

  fs.readFile(filePath, (err, data) => {
    if (err) return res.status(404).json({ error: 'Archivo no encontrado' });
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(data);
  });
});

// XSS REFLEJADO: refleja input del usuario directamente en HTML sin escapar
router.get('/search', (req, res) => {
  const query = req.query.q;
  // Refleja query directamente en HTML — permite inyectar <script>
  res.setHeader('Content-Type', 'text/html');
  res.send(`
    <html>
      <body>
        <h1>Resultados para: ${query}</h1>
        <p>No se encontraron archivos que coincidan con "${query}"</p>
        <input id="search" value="${query}" />
      </body>
    </html>
  `);
});

// INFORMATION DISCLOSURE: lista directorios arbitrarios sin restricción
router.get('/list', (req, res) => {
  const dir = req.query.path || BASE_DIR;
  // Permite listar cualquier directorio del sistema
  fs.readdir(dir, { withFileTypes: true }, (err, entries) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      path: dir,
      entries: entries.map(e => ({ name: e.name, isDir: e.isDirectory() })),
    });
  });
});

// IDOR en archivos: accede a archivos por nombre sin verificar ownership
router.delete('/delete', (req, res) => {
  const filename = req.query.file;
  const filePath = path.join(BASE_DIR, filename);
  fs.unlink(filePath, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: filename });
  });
});

module.exports = router;
