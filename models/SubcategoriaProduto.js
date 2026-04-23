const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const CategoriaProduto = require('./CategoriaProduto');

const SubcategoriaProduto = sequelize.define('SubcategoriaProduto', {
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
  categoriaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'categorias_produto', key: 'id' },
    onDelete: 'RESTRICT',
  },
}, {
  tableName: 'subcategorias_produto',
  timestamps: true,
});

// Associação: cada subcategoria pertence a uma categoria
SubcategoriaProduto.belongsTo(CategoriaProduto, {
  foreignKey: 'categoriaId',
  as: 'categoria',
});

// Associação inversa: uma categoria tem muitas subcategorias
CategoriaProduto.hasMany(SubcategoriaProduto, {
  foreignKey: 'categoriaId',
  as: 'subcategorias',
});

module.exports = SubcategoriaProduto;
