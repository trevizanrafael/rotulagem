const express = require('express');
const router = express.Router();
const userController    = require('../controllers/userController');
const produtosController = require('../controllers/produtosController');

// Auth
router.get('/login',  userController.getLogin);
router.post('/login', userController.postLogin);
router.post('/logout', userController.postLogout);

// Páginas do usuário
router.get('/home',         userController.getHome);
router.get('/avaliacao-ia', userController.getAvaliacaoIA);

// Produtos — CRUD
router.get('/produtos',               produtosController.getProdutos);
router.post('/produtos',              produtosController.postProduto);
router.post('/produtos/:id/editar',   produtosController.putProduto);
router.post('/produtos/:id/deletar',  produtosController.deleteProduto);

// APIs JSON (dynamic dropdowns)
router.get('/api/subcategorias',                    produtosController.getSubcategoriasPorCategoria);
router.get('/api/subcategorias/:id/checklists',     produtosController.getChecklistsDaSubcategoria);

module.exports = router;
