require('dotenv').config();

const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const sequelize = require('./config/database');
const User = require('./models/User');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

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

    // Gera o hash da senha do admin a partir do .env e guarda em memória
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      throw new Error('❌ ADMIN_PASSWORD não definida no .env');
    }
    const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
    app.locals.adminPasswordHash = adminPasswordHash;
    console.log('✅ Senha do admin carregada');

    // Sobe o servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
      console.log(`   Admin:   http://localhost:${PORT}/admin/login`);
      console.log(`   Usuário: http://localhost:${PORT}/login`);
    });

  } catch (err) {
    console.error('❌ Erro ao inicializar:', err.message);
    process.exit(1);
  }
};

init();
