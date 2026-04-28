const Produto        = require('../models/Produto');
const ProdutoRotulo  = require('../models/ProdutoRotulo');
const ProdutoArquivo = require('../models/ProdutoArquivo');

// ── Helpers ───────────────────────────────────────────────────
const auth = (req, res) => {
  if (!req.session.userId) { res.status(401).json({ erro: 'Não autorizado' }); return false; }
  return true;
};

// ── POST /produtos/:id/rotulos — Criar ────────────────────────
const postRotulo = async (req, res) => {
  if (!auth(req, res)) return;
  const { id } = req.params;
  const {
    conteudoLiquido, unidadeMedida, fabricante,
    cnpjFabricante, servicoInspecao, condicoesConservacao, fotosIds,
  } = req.body;

  try {
    const produto = await Produto.findOne({ where: { id, usuarioId: req.session.userId } });
    if (!produto) return res.status(403).json({ erro: 'Produto não encontrado' });

    const rotulo = await ProdutoRotulo.create({
      produtoId:           produto.id,
      conteudoLiquido:     conteudoLiquido?.trim()      || null,
      unidadeMedida:       unidadeMedida                || null,
      fabricante:          fabricante?.trim()           || null,
      cnpjFabricante:      cnpjFabricante?.trim()       || null,
      servicoInspecao:     servicoInspecao?.trim()      || null,
      condicoesConservacao: condicoesConservacao?.trim() || null,
      fotosIds:            Array.isArray(fotosIds) ? fotosIds.map(Number) : [],
    });

    // Devolver rótulo com fotos resolvidas
    const rotuloComFotos = await rotuloComArquivos(rotulo, produto.id);
    res.json({ ok: true, rotulo: rotuloComFotos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao criar rótulo' });
  }
};

// ── POST /produtos/:id/rotulos/:rotuloId/editar — Atualizar ───
const putRotulo = async (req, res) => {
  if (!auth(req, res)) return;
  const { id, rotuloId } = req.params;
  const {
    conteudoLiquido, unidadeMedida, fabricante,
    cnpjFabricante, servicoInspecao, condicoesConservacao, fotosIds,
  } = req.body;

  try {
    const produto = await Produto.findOne({ where: { id, usuarioId: req.session.userId } });
    if (!produto) return res.status(403).json({ erro: 'Produto não encontrado' });

    const rotulo = await ProdutoRotulo.findOne({ where: { id: rotuloId, produtoId: produto.id } });
    if (!rotulo) return res.status(404).json({ erro: 'Rótulo não encontrado' });

    await rotulo.update({
      conteudoLiquido:     conteudoLiquido?.trim()      || null,
      unidadeMedida:       unidadeMedida                || null,
      fabricante:          fabricante?.trim()           || null,
      cnpjFabricante:      cnpjFabricante?.trim()       || null,
      servicoInspecao:     servicoInspecao?.trim()      || null,
      condicoesConservacao: condicoesConservacao?.trim() || null,
      fotosIds:            Array.isArray(fotosIds) ? fotosIds.map(Number) : [],
    });

    const rotuloComFotos = await rotuloComArquivos(rotulo, produto.id);
    res.json({ ok: true, rotulo: rotuloComFotos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao atualizar rótulo' });
  }
};

// ── POST /produtos/:id/rotulos/:rotuloId/deletar ──────────────
const deleteRotulo = async (req, res) => {
  if (!auth(req, res)) return;
  const { id, rotuloId } = req.params;

  try {
    const produto = await Produto.findOne({ where: { id, usuarioId: req.session.userId } });
    if (!produto) return res.status(403).json({ erro: 'Produto não encontrado' });

    const rotulo = await ProdutoRotulo.findOne({ where: { id: rotuloId, produtoId: produto.id } });
    if (!rotulo) return res.status(404).json({ erro: 'Rótulo não encontrado' });

    await rotulo.destroy();
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao deletar rótulo' });
  }
};

// ── Helper: resolve fotos de um rótulo ───────────────────────
async function rotuloComArquivos(rotulo, produtoId) {
  const plain = rotulo.toJSON ? rotulo.toJSON() : { ...rotulo };
  const ids = Array.isArray(plain.fotosIds) ? plain.fotosIds : [];

  if (ids.length === 0) {
    plain.fotos = [];
    return plain;
  }

  const fotos = await ProdutoArquivo.findAll({
    where: { id: ids, produtoId, tipo: 'image' },
  });
  plain.fotos = fotos.map(f => f.toJSON());
  return plain;
}

module.exports = { postRotulo, putRotulo, deleteRotulo };
