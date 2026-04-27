const SubcategoriaProduto = require('../models/SubcategoriaProduto');
const CategoriaProduto = require('../models/CategoriaProduto');
const Checklist = require('../models/Checklist');
// Importar o modelo associativo garante que as associações N:N sejam registradas no Sequelize
require('../models/SubcategoriaChecklist');

const requireAdmin = (req, res, next) => {
  if (!req.session.isAdmin) return res.redirect('/admin/login');
  next();
};

// Helpers reutilizáveis
const _findAll = () => SubcategoriaProduto.findAll({
  order: [['createdAt', 'DESC']],
  include: [
    { model: CategoriaProduto, as: 'categoria', attributes: ['id', 'nome'] },
    { model: Checklist, as: 'checklists', attributes: ['id', 'codigo', 'nome', 'tipo', 'status'], through: { attributes: [] } },
  ],
});

const _findCategorias = () => CategoriaProduto.findAll({
  where: { status: 'ativo' },
  order: [['nome', 'ASC']],
  attributes: ['id', 'nome'],
});

const _findChecklists = () => Checklist.findAll({
  where: { status: 'ativo' },
  order: [['codigo', 'ASC']],
  attributes: ['id', 'codigo', 'nome', 'tipo'],
});

// GET /admin/subcategorias
const getSubcategorias = async (req, res) => {
  try {
    const [subcategorias, categorias, todosChecklists] = await Promise.all([
      _findAll(),
      _findCategorias(),
      _findChecklists(),
    ]);
    const sucesso = req.query.success || null;
    const erro = req.query.error || null;
    const count = req.query.count || null;
    res.render('admin/subcategorias', { subcategorias, categorias, todosChecklists, sucesso, erro, editando: null, count });
  } catch (err) {
    console.error(err);
    res.redirect('/admin/dashboard?error=erro_interno');
  }
};

// GET /admin/subcategorias/:id/editar
const getEditarSubcategoria = async (req, res) => {
  try {
    const [subcategorias, categorias, todosChecklists, editando] = await Promise.all([
      _findAll(),
      _findCategorias(),
      _findChecklists(),
      SubcategoriaProduto.findByPk(req.params.id, {
        include: [
          { model: CategoriaProduto, as: 'categoria', attributes: ['id', 'nome'] },
          { model: Checklist, as: 'checklists', attributes: ['id', 'codigo', 'nome', 'tipo', 'status'], through: { attributes: [] } },
        ],
      }),
    ]);
    if (!editando) return res.redirect('/admin/subcategorias?error=nao_encontrado');
    res.render('admin/subcategorias', { subcategorias, categorias, todosChecklists, sucesso: null, erro: null, editando, count: null });
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

// ── Checklists vinculados ─────────────────────────────────────────────────────

// POST /admin/subcategorias/:id/checklists/vincular  (JSON)
const vincularChecklist = async (req, res) => {
  const { id } = req.params;
  const { checklistId } = req.body;
  try {
    const sub = await SubcategoriaProduto.findByPk(id, {
      include: [{ model: Checklist, as: 'checklists', through: { attributes: [] } }],
    });
    if (!sub) return res.json({ ok: false, mensagem: 'Subcategoria não encontrada.' });
    const chk = await Checklist.findByPk(checklistId);
    if (!chk) return res.json({ ok: false, mensagem: 'Checklist não encontrado.' });

    // addChecklists é criado automaticamente pelo belongsToMany
    await sub.addChecklist(chk);
    res.json({ ok: true, checklist: { id: chk.id, codigo: chk.codigo, nome: chk.nome, tipo: chk.tipo } });
  } catch (err) {
    console.error(err);
    res.json({ ok: false, mensagem: 'Erro interno.' });
  }
};

// POST /admin/subcategorias/:id/checklists/desvincular  (JSON)
const desvincularChecklist = async (req, res) => {
  const { id } = req.params;
  const { checklistId } = req.body;
  try {
    const sub = await SubcategoriaProduto.findByPk(id, {
      include: [{ model: Checklist, as: 'checklists', through: { attributes: [] } }],
    });
    if (!sub) return res.json({ ok: false, mensagem: 'Subcategoria não encontrada.' });
    const chk = await Checklist.findByPk(checklistId);
    if (!chk) return res.json({ ok: false, mensagem: 'Checklist não encontrado.' });

    await sub.removeChecklist(chk);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.json({ ok: false, mensagem: 'Erro interno.' });
  }
};

// GET /admin/subcategorias/:id/checklists  (JSON — lista os checklists atuais)
const getChecklistsDaSub = async (req, res) => {
  try {
    const sub = await SubcategoriaProduto.findByPk(req.params.id, {
      include: [{ model: Checklist, as: 'checklists', attributes: ['id', 'codigo', 'nome', 'tipo', 'status'], through: { attributes: [] } }],
    });
    if (!sub) return res.json({ ok: false });
    res.json({ ok: true, checklists: sub.checklists });
  } catch (err) {
    console.error(err);
    res.json({ ok: false });
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
  vincularChecklist,
  desvincularChecklist,
  getChecklistsDaSub,
};
