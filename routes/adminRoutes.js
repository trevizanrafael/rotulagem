const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/login', adminController.getLogin);
router.post('/login', adminController.postLogin);
router.get('/dashboard', adminController.getDashboard);
router.get('/usuarios', adminController.getUsuarios);
router.post('/usuarios', adminController.postUsuario);
router.post('/logout', adminController.postLogout);

module.exports = router;
