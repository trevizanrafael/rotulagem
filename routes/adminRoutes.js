const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const categoriasController = require('../controllers/categoriasController');

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

module.exports = router;
