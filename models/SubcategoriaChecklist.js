const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const SubcategoriaProduto = require('./SubcategoriaProduto');
const Checklist = require('./Checklist');

const SubcategoriaChecklist = sequelize.define('SubcategoriaChecklist', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  subcategoriaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'subcategorias_produto', key: 'id' },
    onDelete: 'CASCADE',
  },
  checklistId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'checklists', key: 'id' },
    onDelete: 'CASCADE',
  },
}, {
  tableName: 'subcategoria_checklists',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['subcategoriaId', 'checklistId'] },
  ],
});

// Associações N:N via tabela associativa
SubcategoriaProduto.belongsToMany(Checklist, {
  through: SubcategoriaChecklist,
  foreignKey: 'subcategoriaId',
  otherKey: 'checklistId',
  as: 'checklists',
});

Checklist.belongsToMany(SubcategoriaProduto, {
  through: SubcategoriaChecklist,
  foreignKey: 'checklistId',
  otherKey: 'subcategoriaId',
  as: 'subcategorias',
});

module.exports = SubcategoriaChecklist;
