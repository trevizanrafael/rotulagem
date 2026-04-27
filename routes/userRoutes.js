const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const aiController = require('../controllers/aiController');

router.get('/login', userController.getLogin);
router.post('/login', userController.postLogin);
router.get('/home', userController.getHome);
router.post('/logout', userController.postLogout);

// IA Chat
router.post('/chat/ia', aiController.postChat);

module.exports = router;
