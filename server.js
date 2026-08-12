const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = 4000;
const ADMIN_PASSWORD = 'davem2025';

const CATEGORIES = [
  { id: 'guardacorpo', label: 'Guarda Corpo',         folder: 'guarda corpo e corrimao' },
  { id: 'corrimao',    label: 'Corrimão',              folder: 'guarda corpo e corrimao' },
  { id: 'box',         label: 'Box de Banheiro',       folder: 'Box de Banheiro'         },
  { id: 'portao',      label: 'Portões',               folder: 'Portões Aluminio'        },
  { id: 'moveis',      label: 'Móveis de Alumínio',    folder: 'Moveis de Aluminio'      },
  { id: 'cobertura',   label: 'Coberturas e Pergolado',folder: 'Coberturas e pergolado'  },
  { id: 'esquadrias',  label: 'Esquadrias',            folder: 'Esquadrias'              },
];

app.use(express.static(__dirname));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ── Auth ───────────────────────────────── */
const sessions = new Set();

function authMiddleware(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (sessions.has(token)) return next();
  res.status(401).json({ error: 'Não autorizado' });
}

app.post('/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    const token = Math.random().toString(36).slice(2) + Date.now();
    sessions.add(token);
    res.json({ success: true, token });
  } else {
    res.status(401).json({ error: 'Senha incorreta' });
  }
});

/* ── List photos ────────────────────────── */
app.get('/admin/photos/:folder', authMiddleware, (req, res) => {
  const folderName = decodeURIComponent(req.params.folder);
  const folderPath = path.join(__dirname, folderName);
  if (!fs.existsSync(folderPath)) return res.json([]);
  const files = fs.readdirSync(folderPath)
    .filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
    .map(f => ({ name: f, url: `/${folderName}/${f}` }));
  res.json(files);
});

/* ── Delete photo ───────────────────────── */
app.delete('/admin/photos/:folder/:file', authMiddleware, (req, res) => {
  const folderName = decodeURIComponent(req.params.folder);
  const fileName   = decodeURIComponent(req.params.file);
  const filePath   = path.join(__dirname, folderName, fileName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Arquivo não encontrado' });
  }
});

/* ── Upload ─────────────────────────────── */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folderName = decodeURIComponent(req.params.folder);
    const folderPath = path.join(__dirname, folderName);
    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const name = `upload_${Date.now()}${ext}`;
    cb(null, name);
  }
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

app.post('/admin/upload/:folder', authMiddleware, (req, res, next) => {
  upload.array('photos', 50)(req, res, err => {
    if (err) return res.status(400).json({ error: err.message });
    const folderName = decodeURIComponent(req.params.folder);
    const uploaded = req.files.map(f => ({ name: f.filename, url: `/${folderName}/${f.filename}` }));
    res.json({ success: true, files: uploaded });
  });
});

/* ── Admin panel page ───────────────────── */
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.listen(PORT, () => {
  console.log(`\n✅ DAVEM Site rodando em: http://localhost:${PORT}`);
  console.log(`🔐 Painel Admin:          http://localhost:${PORT}/admin`);
  console.log(`🔑 Senha do painel:       davem2025\n`);
});
