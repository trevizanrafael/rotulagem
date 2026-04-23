const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CategoriaProduto = sequelize.define('CategoriaProduto', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nome: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('ativo', 'inativo'),
    allowNull: false,
    defaultValue: 'ativo',
  },
}, {
  tableName: 'categorias_produto',
  timestamps: true,
});

module.exports = CategoriaProduto;
