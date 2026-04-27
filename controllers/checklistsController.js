const Checklist = require('../models/Checklist');
const ChecklistSecao = require('../models/ChecklistSecao');
const ChecklistItem = require('../models/ChecklistItem');
const SubcategoriaProduto = require('../models/SubcategoriaProduto');
// Registra as associações N:N entre Checklist e SubcategoriaProduto
require('../models/SubcategoriaChecklist');
const { Op } = require('sequelize');

const requireAdmin = (req, res, next) => {
  if (!req.session.isAdmin) return res.redirect('/admin/login');
  next();
};

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */

/** Gera o próximo código CHK-XX automaticamente */
async function gerarCodigo() {
  const ultimo = await Checklist.findOne({ order: [['id', 'DESC']] });
  if (!ultimo) return 'CHK-01';
  const match = ultimo.codigo.match(/CHK-(\d+)/);
  const num = match ? parseInt(match[1], 10) + 1 : 1;
  return 'CHK-' + String(num).padStart(2, '0');
}

/* ─────────────────────────────────────────────
   CHECKLISTS
───────────────────────────────────────────── */

const getChecklists = async (req, res) => {
  try {
    const checklists = await Checklist.findAll({
      order: [['createdAt', 'DESC']],
      include: [{
        model: SubcategoriaProduto,
        as: 'subcategorias',
        attributes: ['id', 'nome'],
        through: { attributes: [] },
      }],
    });
    const sucesso = req.query.success || null;
    const erro    = req.query.error  || null;
    const nome    = req.query.nome   || '';
    const codigo  = req.query.codigo || '';
    res.render('admin/checklists', { checklists, sucesso, erro, nome, codigo });
  } catch (err) {
    console.error(err);
    res.redirect('/admin/dashboard?error=erro_interno');
  }
};

const postChecklist = async (req, res) => {
  const { nome, tipo, descricao } = req.body;
  try {
    const codigo = await gerarCodigo();
    await Checklist.create({
      codigo,
      nome: nome.trim(),
      tipo: tipo || 'GERAL',
      descricao: descricao?.trim() || null,
      status: 'ativo',
    });
    res.redirect('/admin/checklists?success=checklist_criado');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/checklists?error=erro_interno');
  }
};

const putChecklist = async (req, res) => {
  const { nome, tipo, descricao, status } = req.body;
  try {
    const chk = await Checklist.findByPk(req.params.id);
    if (!chk) return res.redirect('/admin/checklists?error=nao_encontrado');
    await chk.update({
      nome: nome.trim(),
      tipo: tipo || 'GERAL',
      descricao: descricao?.trim() || null,
      status: status || chk.status,
    });
    res.redirect('/admin/checklists?success=checklist_atualizado');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/checklists?error=erro_interno');
  }
};

const deleteChecklist = async (req, res) => {
  try {
    const chk = await Checklist.findByPk(req.params.id);
    if (!chk) return res.redirect('/admin/checklists?error=nao_encontrado');
    await chk.destroy();
    res.redirect('/admin/checklists?success=checklist_deletado');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/checklists?error=erro_interno');
  }
};

/* Exporta um checklist completo (secoes + itens) como JSON para download */
const exportarChecklist = async (req, res) => {
  try {
    const chk = await Checklist.findByPk(req.params.id, {
      include: [{
        model: ChecklistSecao,
        as: 'secoes',
        include: [{ model: ChecklistItem, as: 'itens' }],
      }],
    });
    if (!chk) return res.redirect('/admin/checklists?error=nao_encontrado');

    const payload = {
      _exportadoEm: new Date().toISOString(),
      nome:     chk.nome,
      tipo:     chk.tipo,
      descricao: chk.descricao || null,
      status:   chk.status,
      secoes: (chk.secoes || [])
        .sort((a, b) => a.ordem - b.ordem)
        .map(sec => ({
          titulo:    sec.titulo,
          descricao: sec.descricao || null,
          status:    sec.status,
          itens: (sec.itens || []).map(item => ({
            pergunta:           item.pergunta,
            descricaoAjuda:     item.descricaoAjuda || null,
            aceitaNaoAplicavel: item.aceitaNaoAplicavel,
            status:             item.status,
          })),
        })),
    };

    const slug = chk.nome.replace(/[^a-z0-9]/gi, '_').toLowerCase().slice(0, 40);
    const filename = `${chk.codigo}_${slug}.json`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.send(JSON.stringify(payload, null, 2));
  } catch (err) {
    console.error(err);
    res.redirect('/admin/checklists?error=erro_interno');
  }
};

/* Importa um checklist completo a partir de JSON enviado via fetch */
const importarChecklist = async (req, res) => {
  const data = req.body.checklist;
  if (!data || !data.nome) {
    return res.json({ ok: false, mensagem: 'Arquivo inválido ou sem nome de checklist.' });
  }
  try {
    const codigo = await gerarCodigo();
    const chk = await Checklist.create({
      codigo,
      nome:     data.nome.trim(),
      tipo:     ['GERAL', 'ESPECIFICA'].includes(data.tipo) ? data.tipo : 'GERAL',
      descricao: data.descricao?.trim() || null,
      status:   data.status === 'inativo' ? 'inativo' : 'ativo',
    });

    const secoes = Array.isArray(data.secoes) ? data.secoes : [];
    for (let i = 0; i < secoes.length; i++) {
      const sd = secoes[i];
      if (!sd.titulo) continue;
      const sec = await ChecklistSecao.create({
        checklistId: chk.id,
        titulo:    sd.titulo.trim(),
        descricao: sd.descricao?.trim() || null,
        ordem:     i,
        status:    sd.status === 'inativo' ? 'inativo' : 'ativo',
      });
      const itens = Array.isArray(sd.itens) ? sd.itens : [];
      for (const id of itens) {
        if (!id.pergunta) continue;
        await ChecklistItem.create({
          checklistSecaoId:   sec.id,
          pergunta:           id.pergunta.trim(),
          descricaoAjuda:     id.descricaoAjuda?.trim() || null,
          aceitaNaoAplicavel: id.aceitaNaoAplicavel !== false,
          status:             id.status === 'inativo' ? 'inativo' : 'ativo',
        });
      }
    }

    res.json({ ok: true, codigo: chk.codigo, nome: chk.nome, secoes: secoes.length });
  } catch (err) {
    console.error(err);
    res.json({ ok: false, mensagem: 'Erro interno ao importar o checklist.' });
  }
};

/* ─────────────────────────────────────────────
   SEÇÕES
───────────────────────────────────────────── */

const getSecoes = async (req, res) => {
  try {
    const checklist = await Checklist.findByPk(req.params.checklistId);
    if (!checklist) return res.redirect('/admin/checklists?error=nao_encontrado');
    const secoes = await ChecklistSecao.findAll({
      where: { checklistId: checklist.id },
      order: [['ordem', 'ASC']],
    });
    const sucesso = req.query.success || null;
    const erro = req.query.error || null;
    res.render('admin/checklist-secoes', { checklist, secoes, sucesso, erro });
  } catch (err) {
    console.error(err);
    res.redirect('/admin/checklists?error=erro_interno');
  }
};

const postSecao = async (req, res) => {
  const { checklistId } = req.params;
  const { titulo, descricao } = req.body;
  try {
    const count = await ChecklistSecao.count({ where: { checklistId } });
    await ChecklistSecao.create({
      checklistId: Number(checklistId),
      titulo: titulo.trim(),
      descricao: descricao?.trim() || null,
      ordem: count,
      status: 'ativo',
    });
    res.redirect(`/admin/checklists/${checklistId}/secoes?success=secao_criada`);
  } catch (err) {
    console.error(err);
    res.redirect(`/admin/checklists/${checklistId}/secoes?error=erro_interno`);
  }
};

const putSecao = async (req, res) => {
  const { checklistId, secaoId } = req.params;
  const { titulo, descricao, status } = req.body;
  try {
    const secao = await ChecklistSecao.findOne({ where: { id: secaoId, checklistId } });
    if (!secao) return res.redirect(`/admin/checklists/${checklistId}/secoes?error=nao_encontrado`);
    await secao.update({
      titulo: titulo.trim(),
      descricao: descricao?.trim() || null,
      status: status || secao.status,
    });
    res.redirect(`/admin/checklists/${checklistId}/secoes?success=secao_atualizada`);
  } catch (err) {
    console.error(err);
    res.redirect(`/admin/checklists/${checklistId}/secoes?error=erro_interno`);
  }
};

const deleteSecao = async (req, res) => {
  const { checklistId, secaoId } = req.params;
  try {
    const secao = await ChecklistSecao.findOne({ where: { id: secaoId, checklistId } });
    if (!secao) return res.redirect(`/admin/checklists/${checklistId}/secoes?error=nao_encontrado`);
    await secao.destroy();
    // Reordenar
    const restantes = await ChecklistSecao.findAll({ where: { checklistId }, order: [['ordem', 'ASC']] });
    for (let i = 0; i < restantes.length; i++) await restantes[i].update({ ordem: i });
    res.redirect(`/admin/checklists/${checklistId}/secoes?success=secao_deletada`);
  } catch (err) {
    console.error(err);
    res.redirect(`/admin/checklists/${checklistId}/secoes?error=erro_interno`);
  }
};

/** PUT /admin/checklists/:checklistId/secoes/reordenar — recebe array de ids ordenados */
const reordenarSecoes = async (req, res) => {
  const { checklistId } = req.params;
  const { ordem } = req.body; // array de ids na nova ordem
  if (!Array.isArray(ordem)) return res.json({ ok: false });
  try {
    for (let i = 0; i < ordem.length; i++) {
      await ChecklistSecao.update({ ordem: i }, { where: { id: Number(ordem[i]), checklistId } });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.json({ ok: false });
  }
};

/* ─────────────────────────────────────────────
   ITENS
───────────────────────────────────────────── */

const getItens = async (req, res) => {
  try {
    const { checklistId, secaoId } = req.params;
    const checklist = await Checklist.findByPk(checklistId);
    const secao = await ChecklistSecao.findOne({ where: { id: secaoId, checklistId } });
    if (!checklist || !secao) return res.redirect('/admin/checklists?error=nao_encontrado');
    const itens = await ChecklistItem.findAll({
      where: { checklistSecaoId: secaoId },
      order: [['createdAt', 'ASC']],
    });
    const sucesso = req.query.success || null;
    const erro = req.query.error || null;
    res.render('admin/checklist-itens', { checklist, secao, itens, sucesso, erro });
  } catch (err) {
    console.error(err);
    res.redirect('/admin/checklists?error=erro_interno');
  }
};

const postItem = async (req, res) => {
  const { checklistId, secaoId } = req.params;
  const { pergunta, descricaoAjuda, aceitaNaoAplicavel } = req.body;
  try {
    await ChecklistItem.create({
      checklistSecaoId: Number(secaoId),
      pergunta: pergunta.trim(),
      descricaoAjuda: descricaoAjuda?.trim() || null,
      aceitaNaoAplicavel: aceitaNaoAplicavel === 'on' || aceitaNaoAplicavel === 'true',
      status: 'ativo',
    });
    res.redirect(`/admin/checklists/${checklistId}/secoes/${secaoId}/itens?success=item_criado`);
  } catch (err) {
    console.error(err);
    res.redirect(`/admin/checklists/${checklistId}/secoes/${secaoId}/itens?error=erro_interno`);
  }
};

const putItem = async (req, res) => {
  const { checklistId, secaoId, itemId } = req.params;
  const { pergunta, descricaoAjuda, aceitaNaoAplicavel, status } = req.body;
  try {
    const item = await ChecklistItem.findOne({ where: { id: itemId, checklistSecaoId: secaoId } });
    if (!item) return res.redirect(`/admin/checklists/${checklistId}/secoes/${secaoId}/itens?error=nao_encontrado`);
    await item.update({
      pergunta: pergunta.trim(),
      descricaoAjuda: descricaoAjuda?.trim() || null,
      aceitaNaoAplicavel: aceitaNaoAplicavel === 'on' || aceitaNaoAplicavel === 'true',
      status: status || item.status,
    });
    res.redirect(`/admin/checklists/${checklistId}/secoes/${secaoId}/itens?success=item_atualizado`);
  } catch (err) {
    console.error(err);
    res.redirect(`/admin/checklists/${checklistId}/secoes/${secaoId}/itens?error=erro_interno`);
  }
};

const deleteItem = async (req, res) => {
  const { checklistId, secaoId, itemId } = req.params;
  try {
    const item = await ChecklistItem.findOne({ where: { id: itemId, checklistSecaoId: secaoId } });
    if (!item) return res.redirect(`/admin/checklists/${checklistId}/secoes/${secaoId}/itens?error=nao_encontrado`);
    await item.destroy();
    res.redirect(`/admin/checklists/${checklistId}/secoes/${secaoId}/itens?success=item_deletado`);
  } catch (err) {
    console.error(err);
    res.redirect(`/admin/checklists/${checklistId}/secoes/${secaoId}/itens?error=erro_interno`);
  }
};

module.exports = {
  requireAdmin,
  // checklists
  getChecklists,
  postChecklist,
  putChecklist,
  deleteChecklist,
  exportarChecklist,
  importarChecklist,
  // secoes
  getSecoes,
  postSecao,
  putSecao,
  deleteSecao,
  reordenarSecoes,
  // itens
  getItens,
  postItem,
  putItem,
  deleteItem,
};
