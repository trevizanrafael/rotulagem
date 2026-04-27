const User = require('../models/User');

// GET /login - Exibe página de login do usuário
const getLogin = (req, res) => {
  if (req.session.userId) {
    return res.redirect('/home');
  }
  const erro = req.query.error || null;
  res.render('user/login', { erro });
};

// POST /login - Processa login do usuário
const postLogin = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ where: { username } });

    if (!user) {
      return res.redirect('/login?error=usuario_nao_encontrado');
    }

    const isValid = await user.comparePassword(password);

    if (!isValid) {
      return res.redirect('/login?error=senha_incorreta');
    }

    req.session.userId = user.id;
    req.session.username = user.username;
    res.redirect('/home');
  } catch (err) {
    console.error(err);
    res.redirect('/login?error=erro_interno');
  }
};

// GET /home - Página inicial do usuário autenticado (chat com IA)
const getHome = (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  res.render('user/chat', { username: req.session.username });
};

// POST /logout - Encerra sessão do usuário
const postLogout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
};

module.exports = {
  getLogin,
  postLogin,
  getHome,
  postLogout,
};
