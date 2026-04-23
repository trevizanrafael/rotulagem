const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Checklist = require('./Checklist');

const ChecklistSecao = sequelize.define('ChecklistSecao', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  checklistId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'checklists', key: 'id' },
    onDelete: 'CASCADE',
  },
  titulo: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  ordem: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.ENUM('ativo', 'inativo'),
    allowNull: false,
    defaultValue: 'ativo',
  },
}, {
  tableName: 'checklist_secoes',
  timestamps: true,
});

// Associações
ChecklistSecao.belongsTo(Checklist, { foreignKey: 'checklistId', as: 'checklist' });
Checklist.hasMany(ChecklistSecao, { foreignKey: 'checklistId', as: 'secoes' });

module.exports = ChecklistSecao;
