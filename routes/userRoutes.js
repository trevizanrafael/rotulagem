const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/login', userController.getLogin);
router.post('/login', userController.postLogin);
router.get('/home', userController.getHome);
router.get('/produtos', userController.getProdutos);
router.get('/avaliacao-ia', userController.getAvaliacaoIA);
router.post('/logout', userController.postLogout);

module.exports = router;
