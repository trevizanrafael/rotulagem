const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const CategoriaProduto = require('./CategoriaProduto');
const SubcategoriaProduto = require('./SubcategoriaProduto');

const Produto = sequelize.define('Produto', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE',
  },
  categoriaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'categorias_produto', key: 'id' },
    onDelete: 'RESTRICT',
  },
  subcategoriaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'subcategorias_produto', key: 'id' },
    onDelete: 'RESTRICT',
  },
  marca: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  denominacaoVenda: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // ── Dados Rótulo ──────────────────────────────────────────────
  conteudoLiquido: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  unidadeMedida: {
    type: DataTypes.ENUM('ml', 'L', 'g', 'kg', 'mg', 'un', 'pç', 'cx'),
    allowNull: true,
  },
  fabricante: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  cnpjFabricante: {
    type: DataTypes.STRING(18),
    allowNull: true,
  },
  servicoInspecao: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  condicoesConservacao: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // ── Análise ───────────────────────────────────────────────────
  statusAnalise: {
    type: DataTypes.ENUM(
      'CHECKLIST_EM_ANDAMENTO',
      'CHECKLIST_CONCLUIDA',
      'PRONTO_PARA_IA',
      'AVALIADO_POR_IA'
    ),
    allowNull: false,
    defaultValue: 'CHECKLIST_EM_ANDAMENTO',
  },
}, {
  tableName: 'produtos',
  timestamps: true,
});

// Associações
Produto.belongsTo(User,                { foreignKey: 'usuarioId',    as: 'usuario'      });
Produto.belongsTo(CategoriaProduto,    { foreignKey: 'categoriaId',  as: 'categoria'    });
Produto.belongsTo(SubcategoriaProduto, { foreignKey: 'subcategoriaId', as: 'subcategoria' });

User.hasMany(Produto,                { foreignKey: 'usuarioId',    as: 'produtos' });
CategoriaProduto.hasMany(Produto,    { foreignKey: 'categoriaId',  as: 'produtos' });
SubcategoriaProduto.hasMany(Produto, { foreignKey: 'subcategoriaId', as: 'produtos' });

module.exports = Produto;
