const SubcategoriaProduto = require('../models/SubcategoriaProduto');
const CategoriaProduto = require('../models/CategoriaProduto');

const requireAdmin = (req, res, next) => {
  if (!req.session.isAdmin) return res.redirect('/admin/login');
  next();
};

// Helpers reutilizáveis
const _findAll = () => SubcategoriaProduto.findAll({
  order: [['createdAt', 'DESC']],
  include: [{ model: CategoriaProduto, as: 'categoria', attributes: ['id', 'nome'] }],
});
const _findCategorias = () => CategoriaProduto.findAll({
  where: { status: 'ativo' },
  order: [['nome', 'ASC']],
  attributes: ['id', 'nome'],
});

// GET /admin/subcategorias
const getSubcategorias = async (req, res) => {
  try {
    const [subcategorias, categorias] = await Promise.all([_findAll(), _findCategorias()]);
    const sucesso = req.query.success || null;
    const erro = req.query.error || null;
    const count = req.query.count || null;
    res.render('admin/subcategorias', { subcategorias, categorias, sucesso, erro, editando: null, count });
  } catch (err) {
    console.error(err);
    res.redirect('/admin/dashboard?error=erro_interno');
  }
};

// GET /admin/subcategorias/:id/editar
const getEditarSubcategoria = async (req, res) => {
  try {
    const [subcategorias, categorias, editando] = await Promise.all([
      _findAll(),
      _findCategorias(),
      SubcategoriaProduto.findByPk(req.params.id, {
        include: [{ model: CategoriaProduto, as: 'categoria', attributes: ['id', 'nome'] }],
      }),
    ]);
    if (!editando) return res.redirect('/admin/subcategorias?error=nao_encontrado');
    res.render('admin/subcategorias', { subcategorias, categorias, sucesso: null, erro: null, editando, count: null });
  } catch (err) {
    console.error(err);
    res.redirect('/admin/subcategorias?error=erro_interno');
  }
};

// POST /admin/subcategorias - Cria nova subcategoria
const postSubcategoria = async (req, res) => {
  const { nome, descricao, categoriaId } = req.body;
  try {
    await SubcategoriaProduto.create({
      nome: nome.trim(),
      descricao: descricao?.trim() || null,
      status: 'ativo',
      categoriaId: Number(categoriaId),
    });
    res.redirect('/admin/subcategorias?success=subcategoria_criada');
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.redirect('/admin/subcategorias?error=nome_ja_existe');
    }
    console.error(err);
    res.redirect('/admin/subcategorias?error=erro_interno');
  }
};

// POST /admin/subcategorias/:id - Atualiza subcategoria
const putSubcategoria = async (req, res) => {
  const { nome, descricao, status, categoriaId } = req.body;
  try {
    const sub = await SubcategoriaProduto.findByPk(req.params.id);
    if (!sub) return res.redirect('/admin/subcategorias?error=nao_encontrado');
    await sub.update({
      nome: nome.trim(),
      descricao: descricao?.trim() || null,
      status,
      categoriaId: Number(categoriaId),
    });
    res.redirect('/admin/subcategorias?success=subcategoria_atualizada');
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.redirect(`/admin/subcategorias/${req.params.id}/editar?error=nome_ja_existe`);
    }
    console.error(err);
    res.redirect('/admin/subcategorias?error=erro_interno');
  }
};

// POST /admin/subcategorias/:id/deletar
const deleteSubcategoria = async (req, res) => {
  try {
    const sub = await SubcategoriaProduto.findByPk(req.params.id);
    if (!sub) return res.redirect('/admin/subcategorias?error=nao_encontrado');
    await sub.destroy();
    res.redirect('/admin/subcategorias?success=subcategoria_deletada');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/subcategorias?error=erro_interno');
  }
};

// POST /admin/subcategorias/:id/status - Toggle ativo/inativo
const toggleStatusSub = async (req, res) => {
  try {
    const sub = await SubcategoriaProduto.findByPk(req.params.id);
    if (!sub) return res.redirect('/admin/subcategorias?error=nao_encontrado');
    await sub.update({ status: sub.status === 'ativo' ? 'inativo' : 'ativo' });
    res.redirect('/admin/subcategorias?success=status_alterado');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/subcategorias?error=erro_interno');
  }
};

// POST /admin/subcategorias/importar - Importa via JSON (fetch)
const importarSubcategorias = async (req, res) => {
  const { subcategorias: lista } = req.body;
  if (!Array.isArray(lista) || lista.length === 0) {
    return res.json({ ok: false, mensagem: 'Nenhum dado recebido.' });
  }

  let importados = 0, ignorados = 0;
  for (const item of lista) {
    if (!item.nome || !item.nome.trim() || !item.categoriaId) { ignorados++; continue; }
    try {
      const [, created] = await SubcategoriaProduto.findOrCreate({
        where: { nome: item.nome.trim() },
        defaults: {
          descricao: item.descricao?.trim() || null,
          status: ['ativo', 'inativo'].includes(item.status) ? item.status : 'ativo',
          categoriaId: Number(item.categoriaId),
        },
      });
      if (created) importados++; else ignorados++;
    } catch (e) {
      ignorados++;
    }
  }
  res.json({ ok: true, importados, ignorados });
};

// POST /admin/subcategorias/deletar-selecionados
const deletarSelecionados = async (req, res) => {
  let ids = req.body.ids;
  if (!ids) return res.redirect('/admin/subcategorias?error=nenhum_selecionado');
  if (!Array.isArray(ids)) ids = [ids];
  ids = ids.map(Number).filter(Boolean);
  if (ids.length === 0) return res.redirect('/admin/subcategorias?error=nenhum_selecionado');

  try {
    await SubcategoriaProduto.destroy({ where: { id: ids } });
    res.redirect('/admin/subcategorias?success=selecionados_deletados&count=' + ids.length);
  } catch (err) {
    console.error(err);
    res.redirect('/admin/subcategorias?error=erro_interno');
  }
};

module.exports = {
  requireAdmin,
  getSubcategorias,
  getEditarSubcategoria,
  postSubcategoria,
  putSubcategoria,
  deleteSubcategoria,
  toggleStatusSub,
  importarSubcategorias,
  deletarSelecionados,
};
