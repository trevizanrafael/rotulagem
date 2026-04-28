const Produto              = require('../models/Produto');
const CategoriaProduto     = require('../models/CategoriaProduto');
const SubcategoriaProduto  = require('../models/SubcategoriaProduto');
const SubcategoriaChecklist = require('../models/SubcategoriaChecklist');
const Checklist            = require('../models/Checklist');

// ── Middleware de autenticação ────────────────────────────────
const requireUser = (req, res, next) => {
  if (!req.session.userId) return res.redirect('/login');
  next();
};

// ── GET /produtos ─────────────────────────────────────────────
const getProdutos = async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');

  try {
    const [produtos, categorias] = await Promise.all([
      Produto.findAll({
        where: { usuarioId: req.session.userId },
        include: [
          { model: CategoriaProduto,    as: 'categoria'    },
          { model: SubcategoriaProduto, as: 'subcategoria' },
        ],
        order: [['createdAt', 'DESC']],
      }),
      CategoriaProduto.findAll({ where: { status: 'ativo' }, order: [['nome', 'ASC']] }),
    ]);

    const subcategorias = await SubcategoriaProduto.findAll({
      where: { status: 'ativo' },
      order: [['nome', 'ASC']],
    });

    res.render('user/produtos', {
      username: req.session.username,
      produtos,
      categorias,
      subcategorias,
      erro: req.query.erro || null,
      sucesso: req.query.sucesso || null,
    });
  } catch (err) {
    console.error(err);
    res.redirect('/home?erro=erro_interno');
  }
};

// ── POST /produtos — Criar ────────────────────────────────────
const postProduto = async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');

  const { categoriaId, subcategoriaId, marca, denominacaoVenda, descricao } = req.body;

  try {
    await Produto.create({
      usuarioId: req.session.userId,
      categoriaId,
      subcategoriaId,
      marca: marca?.trim(),
      denominacaoVenda: denominacaoVenda?.trim(),
      descricao: descricao?.trim() || null,
    });
    res.redirect('/produtos?sucesso=criado');
  } catch (err) {
    console.error(err);
    res.redirect('/produtos?erro=erro_ao_criar');
  }
};

// ── POST /produtos/:id/editar ─────────────────────────────────
const putProduto = async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');

  const { id } = req.params;
  const { categoriaId, subcategoriaId, marca, denominacaoVenda, descricao } = req.body;

  try {
    const produto = await Produto.findOne({ where: { id, usuarioId: req.session.userId } });
    if (!produto) return res.redirect('/produtos?erro=nao_encontrado');

    await produto.update({
      categoriaId,
      subcategoriaId,
      marca: marca?.trim(),
      denominacaoVenda: denominacaoVenda?.trim(),
      descricao: descricao?.trim() || null,
    });
    res.redirect('/produtos?sucesso=editado');
  } catch (err) {
    console.error(err);
    res.redirect('/produtos?erro=erro_ao_editar');
  }
};

// ── POST /produtos/:id/deletar ────────────────────────────────
const deleteProduto = async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');

  const { id } = req.params;

  try {
    const produto = await Produto.findOne({ where: { id, usuarioId: req.session.userId } });
    if (!produto) return res.redirect('/produtos?erro=nao_encontrado');

    await produto.destroy();
    res.redirect('/produtos?sucesso=deletado');
  } catch (err) {
    console.error(err);
    res.redirect('/produtos?erro=erro_ao_deletar');
  }
};

// ── GET /api/subcategorias?categoriaId=X ─────────────────────
// Retorna subcategorias da categoria selecionada (JSON)
const getSubcategoriasPorCategoria = async (req, res) => {
  const { categoriaId } = req.query;
  if (!categoriaId) return res.json([]);

  try {
    const subs = await SubcategoriaProduto.findAll({
      where: { categoriaId, status: 'ativo' },
      order: [['nome', 'ASC']],
    });
    res.json(subs);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar subcategorias' });
  }
};

// ── GET /api/subcategorias/:id/checklists ────────────────────
// Retorna checklists vinculados à subcategoria (JSON)
const getChecklistsDaSubcategoria = async (req, res) => {
  const { id } = req.params;

  try {
    const sub = await SubcategoriaProduto.findByPk(id, {
      include: [{
        model: Checklist,
        as: 'checklists',
        through: { attributes: [] },
        where: { status: 'ativo' },
        required: false,
      }],
    });
    if (!sub) return res.json([]);
    res.json(sub.checklists || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar checklists' });
  }
};

module.exports = {
  requireUser,
  getProdutos,
  postProduto,
  putProduto,
  deleteProduto,
  getSubcategoriasPorCategoria,
  getChecklistsDaSubcategoria,
};
