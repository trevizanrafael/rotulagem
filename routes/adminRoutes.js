const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const categoriasController = require('../controllers/categoriasController');
const subcategoriasController = require('../controllers/subcategoriasController');
const checklistsController = require('../controllers/checklistsController');

const requireAdmin = categoriasController.requireAdmin;

router.get('/login', adminController.getLogin);
router.post('/login', adminController.postLogin);
router.get('/dashboard', adminController.getDashboard);
router.get('/usuarios', adminController.getUsuarios);
router.post('/usuarios', adminController.postUsuario);
router.post('/usuarios/deletar-selecionados', adminController.deletarSelecionadosUsuarios);
router.post('/usuarios/:id', adminController.putUsuario);
router.post('/usuarios/:id/deletar', adminController.deleteUsuario);
router.post('/logout', adminController.postLogout);

// Categorias de produtos
router.get('/categorias', requireAdmin, categoriasController.getCategorias);
router.post('/categorias', requireAdmin, categoriasController.postCategoria);
router.post('/categorias/importar', requireAdmin, categoriasController.importarCategorias);
router.post('/categorias/deletar-selecionados', requireAdmin, categoriasController.deletarSelecionados);
router.get('/categorias/:id/editar', requireAdmin, categoriasController.getEditarCategoria);
router.post('/categorias/:id', requireAdmin, categoriasController.putCategoria);
router.post('/categorias/:id/deletar', requireAdmin, categoriasController.deleteCategoria);
router.post('/categorias/:id/status', requireAdmin, categoriasController.toggleStatus);

// Subcategorias de produtos
router.get('/subcategorias', requireAdmin, subcategoriasController.getSubcategorias);
router.post('/subcategorias', requireAdmin, subcategoriasController.postSubcategoria);
router.post('/subcategorias/importar', requireAdmin, subcategoriasController.importarSubcategorias);
router.post('/subcategorias/deletar-selecionados', requireAdmin, subcategoriasController.deletarSelecionados);
router.get('/subcategorias/:id/editar', requireAdmin, subcategoriasController.getEditarSubcategoria);
router.post('/subcategorias/:id', requireAdmin, subcategoriasController.putSubcategoria);
router.post('/subcategorias/:id/deletar', requireAdmin, subcategoriasController.deleteSubcategoria);
router.post('/subcategorias/:id/status', requireAdmin, subcategoriasController.toggleStatusSub);

// ── Checklists ──────────────────────────────────────────────
router.get('/checklists', checklistsController.requireAdmin, checklistsController.getChecklists);
router.post('/checklists', checklistsController.requireAdmin, checklistsController.postChecklist);
router.post('/checklists/importar', checklistsController.requireAdmin, checklistsController.importarChecklist);
router.get('/checklists/:id/exportar', checklistsController.requireAdmin, checklistsController.exportarChecklist);
router.post('/checklists/:id/editar', checklistsController.requireAdmin, checklistsController.putChecklist);
router.post('/checklists/:id/deletar', checklistsController.requireAdmin, checklistsController.deleteChecklist);

// ── Seções de Checklist ──────────────────────────────────────
router.get('/checklists/:checklistId/secoes', checklistsController.requireAdmin, checklistsController.getSecoes);
router.post('/checklists/:checklistId/secoes', checklistsController.requireAdmin, checklistsController.postSecao);
router.post('/checklists/:checklistId/secoes/reordenar', checklistsController.requireAdmin, checklistsController.reordenarSecoes);
router.post('/checklists/:checklistId/secoes/:secaoId/editar', checklistsController.requireAdmin, checklistsController.putSecao);
router.post('/checklists/:checklistId/secoes/:secaoId/deletar', checklistsController.requireAdmin, checklistsController.deleteSecao);

// ── Itens de Seção ───────────────────────────────────────────
router.get('/checklists/:checklistId/secoes/:secaoId/itens', checklistsController.requireAdmin, checklistsController.getItens);
router.post('/checklists/:checklistId/secoes/:secaoId/itens', checklistsController.requireAdmin, checklistsController.postItem);
router.post('/checklists/:checklistId/secoes/:secaoId/itens/:itemId/editar', checklistsController.requireAdmin, checklistsController.putItem);
router.post('/checklists/:checklistId/secoes/:secaoId/itens/:itemId/deletar', checklistsController.requireAdmin, checklistsController.deleteItem);

module.exports = router;

