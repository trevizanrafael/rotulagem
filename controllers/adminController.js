const bcrypt = require('bcryptjs');
const path = require('path');

// GET /admin/login - Exibe página de login do admin
const getLogin = (req, res) => {
  if (req.session.isAdmin) {
    return res.redirect('/admin/dashboard');
  }
  res.sendFile(path.join(__dirname, '../views/admin/login.html'));
};

// POST /admin/login - Processa login do admin
const postLogin = async (req, res) => {
  const { password } = req.body;

  const isValid = await bcrypt.compare(password, req.app.locals.adminPasswordHash);

  if (!isValid) {
    return res.redirect('/admin/login?error=senha_incorreta');
  }

  req.session.isAdmin = true;
  res.redirect('/admin/dashboard');
};

// GET /admin/dashboard - Painel do admin
const getDashboard = (req, res) => {
  if (!req.session.isAdmin) {
    return res.redirect('/admin/login');
  }
  res.sendFile(path.join(__dirname, '../views/admin/dashboard.html'));
};

// GET /admin/usuarios - Página de cadastro de usuários
const getUsuarios = (req, res) => {
  if (!req.session.isAdmin) {
    return res.redirect('/admin/login');
  }
  res.sendFile(path.join(__dirname, '../views/admin/usuarios.html'));
};

// POST /admin/usuarios - Cria novo usuário
const postUsuario = async (req, res) => {
  if (!req.session.isAdmin) {
    return res.redirect('/admin/login');
  }

  const { username, password } = req.body;
  const User = require('../models/User');

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
