const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Produto = require('./Produto');

/**
 * ProdutoRotulo — cada linha representa um rótulo cadastrado para o produto.
 * Um produto pode ter vários rótulos (ex: embalagem 1L e 500ml).
 * fotosIds é um array JSON de IDs de ProdutoArquivo vinculados.
 */
const ProdutoRotulo = sequelize.define('ProdutoRotulo', {
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
  // IDs dos ProdutoArquivo vinculados a este rótulo
  fotosIds: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  },
}, {
  tableName: 'produto_rotulos',
  timestamps: true,
});

ProdutoRotulo.belongsTo(Produto, { foreignKey: 'produtoId', as: 'produto' });
Produto.hasMany(ProdutoRotulo,  { foreignKey: 'produtoId', as: 'rotulos' });

module.exports = ProdutoRotulo;
