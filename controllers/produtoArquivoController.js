const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const Produto         = require('../models/Produto');
const ProdutoArquivo  = require('../models/ProdutoArquivo');

// ── Pasta de uploads ──────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads', 'produtos');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ── Configuração Multer ───────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const base = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, base);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg','image/png','image/webp','image/gif','application/pdf'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Tipo de arquivo não permitido. Use imagens (JPG, PNG, WEBP) ou PDF.'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB por arquivo
});

// ── POST /produtos/:id/arquivos — Upload ──────────────────────
const postArquivo = [
  upload.array('arquivos', 10), // até 10 arquivos por vez
  async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ erro: 'Não autorizado' });

    const { id } = req.params;
    try {
      const produto = await Produto.findOne({ where: { id, usuarioId: req.session.userId } });
      if (!produto) return res.status(403).json({ erro: 'Produto não encontrado' });

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ erro: 'Nenhum arquivo enviado' });
      }

      const criados = [];
      for (const file of req.files) {
        const tipo = file.mimetype === 'application/pdf' ? 'pdf' : 'image';
        const arq  = await ProdutoArquivo.create({
          produtoId:    produto.id,
          nomeOriginal: file.originalname,
          nomeSalvo:    file.filename,
          tipo,
          mimeType: file.mimetype,
          tamanho:  file.size,
        });
        criados.push(arq);
      }

      res.json({ ok: true, arquivos: criados });
    } catch (err) {
      console.error(err);
      res.status(500).json({ erro: err.message || 'Erro ao salvar arquivo' });
    }
  },
];

// ── GET /produtos/:id/arquivos — Listar ───────────────────────
const getArquivos = async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ erro: 'Não autorizado' });

  const { id } = req.params;
  try {
    const produto = await Produto.findOne({ where: { id, usuarioId: req.session.userId } });
    if (!produto) return res.status(403).json({ erro: 'Produto não encontrado' });

    const arquivos = await ProdutoArquivo.findAll({
      where: { produtoId: produto.id },
      order: [['createdAt', 'DESC']],
    });
    res.json(arquivos);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao listar arquivos' });
  }
};

// ── POST /produtos/:id/arquivos/:arquivoId/deletar ────────────
const deleteArquivo = async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ erro: 'Não autorizado' });

  const { id, arquivoId } = req.params;
  try {
    const produto = await Produto.findOne({ where: { id, usuarioId: req.session.userId } });
    if (!produto) return res.status(403).json({ erro: 'Produto não encontrado' });

    const arq = await ProdutoArquivo.findOne({ where: { id: arquivoId, produtoId: produto.id } });
    if (!arq) return res.status(404).json({ erro: 'Arquivo não encontrado' });

    // Remove arquivo físico
    const filePath = path.join(UPLOAD_DIR, arq.nomeSalvo);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await arq.destroy();
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao deletar arquivo' });
  }
};

// ── POST /produtos/:id/arquivos/:arquivoId/renomear ───────────
const renomearArquivo = async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ erro: 'Não autorizado' });

  const { id, arquivoId } = req.params;
  const { nomeOriginal } = req.body;

  if (!nomeOriginal?.trim()) return res.status(400).json({ erro: 'Nome inválido' });

  try {
    const produto = await Produto.findOne({ where: { id, usuarioId: req.session.userId } });
    if (!produto) return res.status(403).json({ erro: 'Produto não encontrado' });

    const arq = await ProdutoArquivo.findOne({ where: { id: arquivoId, produtoId: produto.id } });
    if (!arq) return res.status(404).json({ erro: 'Arquivo não encontrado' });

    await arq.update({ nomeOriginal: nomeOriginal.trim() });
    res.json({ ok: true, nomeOriginal: arq.nomeOriginal });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao renomear' });
  }
};

module.exports = { postArquivo, getArquivos, deleteArquivo, renomearArquivo };
