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
    const count = req.query.count || null;
    res.render('admin/categorias', { categorias, sucesso, erro, editando: null, count });
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
    res.render('admin/categorias', { categorias, sucesso: null, erro: null, editando, count: null });
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

// POST /admin/categorias/importar - Importa categorias via JSON (fetch)
const importarCategorias = async (req, res) => {
  const { categorias: lista } = req.body;
  if (!Array.isArray(lista) || lista.length === 0) {
    return res.json({ ok: false, mensagem: 'Nenhum dado recebido.' });
  }

  let importados = 0, ignorados = 0;
  for (const item of lista) {
    if (!item.nome || !item.nome.trim()) { ignorados++; continue; }
    try {
      const [, created] = await CategoriaProduto.findOrCreate({
        where: { nome: item.nome.trim() },
        defaults: {
          descricao: item.descricao?.trim() || null,
          status: ['ativo', 'inativo'].includes(item.status) ? item.status : 'ativo',
        },
      });
      if (created) importados++; else ignorados++;
    } catch (e) {
      ignorados++;
    }
  }
  res.json({ ok: true, importados, ignorados });
};

// POST /admin/categorias/deletar-selecionados - Remove múltiplas categorias
const deletarSelecionados = async (req, res) => {
  let ids = req.body.ids;
  if (!ids) return res.redirect('/admin/categorias?error=nenhum_selecionado');
  if (!Array.isArray(ids)) ids = [ids];
  ids = ids.map(Number).filter(Boolean);
  if (ids.length === 0) return res.redirect('/admin/categorias?error=nenhum_selecionado');

  try {
    await CategoriaProduto.destroy({ where: { id: ids } });
    res.redirect(`/admin/categorias?success=selecionados_deletados&count=${ids.length}`);
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
  importarCategorias,
  deletarSelecionados,
};

