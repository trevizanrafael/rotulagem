const Produto               = require('../models/Produto');
const CategoriaProduto      = require('../models/CategoriaProduto');
const SubcategoriaProduto   = require('../models/SubcategoriaProduto');
const SubcategoriaChecklist = require('../models/SubcategoriaChecklist');
const Checklist             = require('../models/Checklist');
const ChecklistSecao        = require('../models/ChecklistSecao');
const ChecklistItem         = require('../models/ChecklistItem');
const ProdutoRespostaItem   = require('../models/ProdutoRespostaItem');

// ── Helpers ───────────────────────────────────────────────────
const requireUser = (req, res, next) => {
  if (!req.session.userId) return res.redirect('/login');
  next();
};

const STATUS_LABELS = {
  CHECKLIST_EM_ANDAMENTO: { label: 'Checklist em andamento', color: '#d97706', bg: '#fef3c7', border: '#fde68a' },
  CHECKLIST_CONCLUIDA:    { label: 'Checklist concluída',    color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  PRONTO_PARA_IA:         { label: 'Pronto para IA',         color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  AVALIADO_POR_IA:        { label: 'Avaliado por IA',        color: '#036ec0', bg: '#e6f2fb', border: '#cce4f6' },
};

// ── GET /produtos/:id — Página de detalhe ─────────────────────
const getProdutoDetalhe = async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');

  const { id } = req.params;
  const tab = req.query.tab || 'identificacao';

  try {
    // Produto + relações
    const produto = await Produto.findOne({
      where: { id, usuarioId: req.session.userId },
      include: [
        { model: CategoriaProduto,    as: 'categoria'    },
        { model: SubcategoriaProduto, as: 'subcategoria' },
      ],
    });
    if (!produto) return res.redirect('/produtos?erro=nao_encontrado');

    // Checklists vinculados à subcategoria (com seções e itens)
    const sub = await SubcategoriaProduto.findByPk(produto.subcategoriaId, {
      include: [{
        model: Checklist,
        as: 'checklists',
        through: { attributes: [] },
        where: { status: 'ativo' },
        required: false,
        include: [{
          model: ChecklistSecao,
          as: 'secoes',
          where: { status: 'ativo' },
          required: false,
          order: [['ordem', 'ASC']],
          include: [{
            model: ChecklistItem,
            as: 'itens',
            where: { status: 'ativo' },
            required: false,
          }],
        }],
      }],
    });

    const checklists = sub ? (sub.checklists || []) : [];

    // Respostas existentes deste produto indexadas por checklistItemId
    const respostasDb = await ProdutoRespostaItem.findAll({
      where: { produtoId: produto.id },
    });
    const respostasMap = {};
    respostasDb.forEach(r => { respostasMap[r.checklistItemId] = r; });

    // Categorias para o form de edição
    const categorias = await CategoriaProduto.findAll({
      where: { status: 'ativo' }, order: [['nome', 'ASC']],
    });

    res.render('user/produto-detalhe', {
      username: req.session.username,
      produto,
      checklists,
      respostasMap,
      categorias,
      statusLabels: STATUS_LABELS,
      tab,
      sucesso: req.query.sucesso || null,
      erro: req.query.erro    || null,
    });
  } catch (err) {
    console.error(err);
    res.redirect('/produtos?erro=erro_interno');
  }
};

// ── POST /produtos/:id/rotulo — Salvar dados rótulo ───────────
const postRotulo = async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');

  const { id } = req.params;
  const {
    conteudoLiquido, unidadeMedida, fabricante,
    cnpjFabricante, servicoInspecao, condicoesConservacao,
  } = req.body;

  try {
    const produto = await Produto.findOne({ where: { id, usuarioId: req.session.userId } });
    if (!produto) return res.redirect('/produtos?erro=nao_encontrado');

    await produto.update({
      conteudoLiquido:      conteudoLiquido?.trim()      || null,
      unidadeMedida:        unidadeMedida                || null,
      fabricante:           fabricante?.trim()           || null,
      cnpjFabricante:       cnpjFabricante?.trim()       || null,
      servicoInspecao:      servicoInspecao?.trim()      || null,
      condicoesConservacao: condicoesConservacao?.trim() || null,
    });
    res.redirect(`/produtos/${id}?tab=rotulo&sucesso=rotulo_salvo`);
  } catch (err) {
    console.error(err);
    res.redirect(`/produtos/${id}?tab=rotulo&erro=erro_ao_salvar`);
  }
};

// ── POST /produtos/:id/checklist/:checklistId/respostas ───────
// Salva as respostas de todos os itens de uma checklist
const postRespostas = async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');

  const { id, checklistId } = req.params;
  const { respostas } = req.body; // { [itemId]: { resultado, observacao } }

  try {
    const produto = await Produto.findOne({ where: { id, usuarioId: req.session.userId } });
    if (!produto) return res.status(403).json({ erro: 'Produto não encontrado' });

    // Salvar ou atualizar cada resposta
    const entries = Object.entries(respostas || {});
    for (const [itemId, dados] of entries) {
      await ProdutoRespostaItem.upsert({
        produtoId:      produto.id,
        checklistItemId: parseInt(itemId),
        resultado:      dados.resultado || 'NAO_AVALIADO',
        observacao:     dados.observacao?.trim() || null,
      });
    }

    // Recalcular statusAnalise automaticamente
    await recalcularStatus(produto);

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao salvar respostas' });
  }
};

// ── Recalcular status do produto ──────────────────────────────
async function recalcularStatus(produto) {
  // Busca todos os itens de todos os checklists vinculados à subcategoria
  const sub = await SubcategoriaProduto.findByPk(produto.subcategoriaId, {
    include: [{
      model: Checklist,
      as: 'checklists',
      through: { attributes: [] },
      where: { status: 'ativo' },
      required: false,
      include: [{
        model: ChecklistSecao,
        as: 'secoes',
        where: { status: 'ativo' },
        required: false,
        include: [{ model: ChecklistItem, as: 'itens', where: { status: 'ativo' }, required: false }],
      }],
    }],
  });

  const todosItens = [];
  (sub?.checklists || []).forEach(cl =>
    (cl.secoes || []).forEach(s =>
      (s.itens || []).forEach(i => todosItens.push(i.id))
    )
  );

  if (todosItens.length === 0) return;

  const respostas = await ProdutoRespostaItem.findAll({
    where: { produtoId: produto.id, checklistItemId: todosItens },
  });

  const respondidos = respostas.filter(r => r.resultado !== 'NAO_AVALIADO');
  const todosConcluidos = respondidos.length === todosItens.length;

  let novoStatus = produto.statusAnalise;

  // Se ainda não foi avaliado por IA e não estava como PRONTO_PARA_IA
  if (produto.statusAnalise === 'AVALIADO_POR_IA' || produto.statusAnalise === 'PRONTO_PARA_IA') {
    return; // Não retroagir se já chegou nessas fases
  }

  novoStatus = todosConcluidos ? 'CHECKLIST_CONCLUIDA' : 'CHECKLIST_EM_ANDAMENTO';
  await produto.update({ statusAnalise: novoStatus });
}

module.exports = {
  requireUser,
  getProdutoDetalhe,
  postRotulo,
  postRespostas,
};
