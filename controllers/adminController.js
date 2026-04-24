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
const getDashboard = async (req, res) => {
  if (!req.session.isAdmin) {
    return res.redirect('/admin/login');
  }
  try {
    const Checklist = require('../models/Checklist');
    const totalChecklists = await Checklist.count();
    const ativosChecklists = await Checklist.count({ where: { status: 'ativo' } });
    res.render('admin/dashboard', { totalChecklists, ativosChecklists });
  } catch (err) {
    console.error(err);
    res.render('admin/dashboard', { totalChecklists: 0, ativosChecklists: 0 });
  }
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
    const count = req.query.count || null;

    res.render('admin/usuarios', { usuarios, sucesso, erro, count });
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

// POST /admin/usuarios/:id - Atualiza usuário (senha só muda se informada)
const putUsuario = async (req, res) => {
  if (!req.session.isAdmin) return res.redirect('/admin/login');

  const { id } = req.params;
  const { username, password } = req.body;

  try {
    const user = await User.findByPk(id);
    if (!user) return res.redirect('/admin/usuarios?error=nao_encontrado');

    user.username = username;
    if (password && password.trim() !== '') {
      user.password = password; // hook beforeUpdate faz o hash
    }
    await user.save();
    res.redirect('/admin/usuarios?success=usuario_atualizado');
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.redirect('/admin/usuarios?error=usuario_ja_existe');
    }
    console.error(err);
    res.redirect('/admin/usuarios?error=erro_interno');
  }
};

// POST /admin/usuarios/:id/deletar - Remove um usuário
const deleteUsuario = async (req, res) => {
  if (!req.session.isAdmin) return res.redirect('/admin/login');

  try {
    const user = await User.findByPk(req.params.id);
    if (user) await user.destroy();
    res.redirect('/admin/usuarios?success=usuario_deletado');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/usuarios?error=erro_interno');
  }
};

// POST /admin/usuarios/deletar-selecionados - Remove múltiplos usuários
const deletarSelecionadosUsuarios = async (req, res) => {
  if (!req.session.isAdmin) return res.redirect('/admin/login');

  let ids = req.body.ids;
  if (!ids) return res.redirect('/admin/usuarios?error=nenhum_selecionado');
  if (!Array.isArray(ids)) ids = [ids];

  try {
    const count = await User.destroy({ where: { id: ids } });
    res.redirect(`/admin/usuarios?success=selecionados_deletados&count=${count}`);
  } catch (err) {
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
  putUsuario,
  deleteUsuario,
  deletarSelecionadosUsuarios,
  postLogout,
};
