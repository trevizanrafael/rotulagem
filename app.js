require('dotenv').config();

const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const sequelize = require('./config/database');
const User = require('./models/User');
require('./models/CategoriaProduto'); // registrar model para sync
require('./models/SubcategoriaProduto');
require('./models/Checklist');
require('./models/ChecklistSecao');
require('./models/ChecklistItem');
require('./models/SubcategoriaChecklist');
require('./models/Produto');
require('./models/ProdutoRespostaItem');
require('./models/ProdutoArquivo');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Arquivos estáticos
app.use(express.static('public'));
// Servir uploads de produtos
app.use('/uploads', require('express').static(require('path').join(__dirname, 'public', 'uploads')));

// Template engine
app.set('view engine', 'ejs');
app.set('views', './views');

// Middleware de parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configuração de sessão
app.use(session({
  secret: process.env.SESSION_SECRET || 'segredo_padrao',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }, // mudar para true em produção com HTTPS
}));

// Rotas
app.use('/admin', adminRoutes);
app.use('/', userRoutes);

// Rota raiz redireciona para login do usuário
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Inicialização: conecta ao banco, sincroniza modelos e sobe o servidor
const init = async () => {
  try {
    // Testa conexão com o banco
    await sequelize.authenticate();
    console.log('✅ Conectado ao PostgreSQL');

    // Sincroniza os models (cria tabelas se não existirem)
    await sequelize.sync({ alter: true });
    console.log('✅ Tabelas sincronizadas');

    // Carrega credenciais do admin a partir do .env e guarda em memória
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminUsername || !adminPassword) {
      throw new Error('❌ ADMIN_USERNAME ou ADMIN_PASSWORD não definidos no .env');
    }
    const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
    app.locals.adminUsername = adminUsername;
    app.locals.adminPasswordHash = adminPasswordHash;
    console.log('✅ Credenciais do admin carregadas');

    // Sobe o servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
      console.log(`   Admin:   http://localhost:${PORT}/admin/login`);
      console.log(`   Usuário: http://localhost:${PORT}/login`);
      console.log(`   Dashboard: http://localhost:${PORT}/admin/dashboard`);

    });

  } catch (err) {
    console.error('❌ Erro ao inicializar:', err.message);
    process.exit(1);
  }
};

init();
