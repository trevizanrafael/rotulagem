const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const ChecklistSecao = require('./ChecklistSecao');

const ChecklistItem = sequelize.define('ChecklistItem', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  checklistSecaoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'checklist_secoes', key: 'id' },
    onDelete: 'CASCADE',
  },
  pergunta: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  descricaoAjuda: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  aceitaNaoAplicavel: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Se true, permite resposta "Não Aplicável" além de Conforme, Não Conforme, Não Avaliado',
  },
  status: {
    type: DataTypes.ENUM('ativo', 'inativo'),
    allowNull: false,
    defaultValue: 'ativo',
  },
}, {
  tableName: 'checklist_itens',
  timestamps: true,
});

// Associações
ChecklistItem.belongsTo(ChecklistSecao, { foreignKey: 'checklistSecaoId', as: 'secao' });
ChecklistSecao.hasMany(ChecklistItem, { foreignKey: 'checklistSecaoId', as: 'itens' });

module.exports = ChecklistItem;
