const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Produto = require('./Produto');

const ProdutoArquivo = sequelize.define('ProdutoArquivo', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  produtoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'produtos', key: 'id' },
    onDelete: 'CASCADE',
  },
  nomeOriginal: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  nomeSalvo: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  tipo: {
    type: DataTypes.ENUM('image', 'pdf'),
    allowNull: false,
  },
  mimeType: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  tamanho: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Tamanho em bytes',
  },
}, {
  tableName: 'produto_arquivos',
  timestamps: true,
});

ProdutoArquivo.belongsTo(Produto, { foreignKey: 'produtoId', as: 'produto' });
Produto.hasMany(ProdutoArquivo,  { foreignKey: 'produtoId', as: 'arquivos' });

module.exports = ProdutoArquivo;
