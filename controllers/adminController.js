const bcrypt = require('bcryptjs');
const User = require('../models/User');

// GET /admin/login - Exibe página de login do admin
const getLogin = (req, res) => {
  if (req.session.isAdmin) {
    return res.redirect('/admin/dashboard');
  }
  const erro = req.query.error || null;
  res.render('admin/login', { erro });
};

// POST /admin/login - Processa login do admin
const postLogin = async (req, res) => {
  const { username, password } = req.body;

  const usernameCorreto = username === req.app.locals.adminUsername;
  const senhaCorreta = await bcrypt.compare(password, req.app.locals.adminPasswordHash);

  if (!usernameCorreto || !senhaCorreta) {
    return res.redirect('/admin/login?error=credenciais_invalidas');
  }

  req.session.isAdmin = true;
  res.redirect('/admin/dashboard');
};

// GET /admin/dashboard - Painel do admin
const getDashboard = (req, res) => {
  if (!req.session.isAdmin) {
    return res.redirect('/admin/login');
  }
  res.render('admin/dashboard');
};

// GET /admin/usuarios - Lista e cadastro de usuários
const getUsuarios = async (req, res) => {
  if (!req.session.isAdmin) {
    return res.redirect('/admin/login');
  }

  try {
    const usuarios = await User.findAll({
      attributes: ['id', 'username', 'createdAt', 'updatedAt'],
      order: [['createdAt', 'DESC']],
    });

    const sucesso = req.query.success || null;
    const erro = req.query.error || null;

    res.render('admin/usuarios', { usuarios, sucesso, erro });
  } catch (err) {
    console.error(err);
    res.redirect('/admin/dashboard?error=erro_interno');
  }
};

// POST /admin/usuarios - Cria novo usuário
const postUsuario = async (req, res) => {
  if (!req.session.isAdmin) {
    return res.redirect('/admin/login');
  }

  const { username, password } = req.body;

  try {
    await User.create({ username, password });
    res.redirect('/admin/usuarios?success=usuario_criado');
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.redirect('/admin/usuarios?error=usuario_ja_existe');
    }
    console.error(err);
    res.redirect('/admin/usuarios?error=erro_interno');
  }
};

// POST /admin/logout - Encerra sessão do admin
const postLogout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
};

module.exports = {
  getLogin,
  postLogin,
  getDashboard,
  getUsuarios,
  postUsuario,
  postLogout,
};
