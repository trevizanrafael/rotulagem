const CategoriaProduto = require('../models/CategoriaProduto');

// Middleware de autenticação reutilizável
const requireAdmin = (req, res, next) => {
  if (!req.session.isAdmin) return res.redirect('/admin/login');
  next();
};

// GET /admin/categorias - Lista categorias
const getCategorias = async (req, res) => {
  try {
    const categorias = await CategoriaProduto.findAll({ order: [['createdAt', 'DESC']] });
    const sucesso = req.query.success || null;
    const erro = req.query.error || null;
    res.render('admin/categorias', { categorias, sucesso, erro, editando: null });
  } catch (err) {
    console.error(err);
    res.redirect('/admin/dashboard?error=erro_interno');
  }
};

// GET /admin/categorias/:id/editar - Carrega form de edição
const getEditarCategoria = async (req, res) => {
  try {
    const categorias = await CategoriaProduto.findAll({ order: [['createdAt', 'DESC']] });
    const editando = await CategoriaProduto.findByPk(req.params.id);
    if (!editando) return res.redirect('/admin/categorias?error=nao_encontrado');
    res.render('admin/categorias', { categorias, sucesso: null, erro: null, editando });
  } catch (err) {
    console.error(err);
    res.redirect('/admin/categorias?error=erro_interno');
  }
};

// POST /admin/categorias - Cria nova categoria
const postCategoria = async (req, res) => {
  const { nome, descricao } = req.body;
  try {
    await CategoriaProduto.create({ nome: nome.trim(), descricao: descricao?.trim() || null, status: 'ativo' });
    res.redirect('/admin/categorias?success=categoria_criada');
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.redirect('/admin/categorias?error=nome_ja_existe');
    }
    console.error(err);
    res.redirect('/admin/categorias?error=erro_interno');
  }
};

// POST /admin/categorias/:id - Atualiza categoria
const putCategoria = async (req, res) => {
  const { nome, descricao, status } = req.body;
  try {
    const cat = await CategoriaProduto.findByPk(req.params.id);
    if (!cat) return res.redirect('/admin/categorias?error=nao_encontrado');
    await cat.update({ nome: nome.trim(), descricao: descricao?.trim() || null, status });
    res.redirect('/admin/categorias?success=categoria_atualizada');
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.redirect(`/admin/categorias/${req.params.id}/editar?error=nome_ja_existe`);
    }
    console.error(err);
    res.redirect('/admin/categorias?error=erro_interno');
  }
};

// POST /admin/categorias/:id/deletar - Remove categoria
const deleteCategoria = async (req, res) => {
  try {
    const cat = await CategoriaProduto.findByPk(req.params.id);
    if (!cat) return res.redirect('/admin/categorias?error=nao_encontrado');
    await cat.destroy();
    res.redirect('/admin/categorias?success=categoria_deletada');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/categorias?error=erro_interno');
  }
};

// POST /admin/categorias/:id/status - Alterna status ativo/inativo
const toggleStatus = async (req, res) => {
  try {
    const cat = await CategoriaProduto.findByPk(req.params.id);
    if (!cat) return res.redirect('/admin/categorias?error=nao_encontrado');
    await cat.update({ status: cat.status === 'ativo' ? 'inativo' : 'ativo' });
    res.redirect('/admin/categorias?success=status_alterado');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/categorias?error=erro_interno');
  }
};

module.exports = {
  requireAdmin,
  getCategorias,
  getEditarCategoria,
  postCategoria,
  putCategoria,
  deleteCategoria,
  toggleStatus,
};
