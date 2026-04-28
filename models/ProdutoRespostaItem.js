const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Produto = require('./Produto');
const ChecklistItem = require('./ChecklistItem');

/**
 * ProdutoRespostaItem — armazena a resposta de cada item de checklist para um produto.
 * resultado: 'CONFORME' | 'NAO_CONFORME' | 'NAO_APLICAVEL' | 'NAO_AVALIADO'
 */
const ProdutoRespostaItem = sequelize.define('ProdutoRespostaItem', {
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
  checklistItemId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'checklist_itens', key: 'id' },
    onDelete: 'CASCADE',
  },
  resultado: {
    type: DataTypes.ENUM('CONFORME', 'NAO_CONFORME', 'NAO_APLICAVEL', 'NAO_AVALIADO'),
    allowNull: false,
    defaultValue: 'NAO_AVALIADO',
  },
  observacao: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'produto_respostas_item',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['produtoId', 'checklistItemId'] },
  ],
});

// Associações
ProdutoRespostaItem.belongsTo(Produto,       { foreignKey: 'produtoId',      as: 'produto'       });
ProdutoRespostaItem.belongsTo(ChecklistItem, { foreignKey: 'checklistItemId', as: 'checklistItem' });

Produto.hasMany(ProdutoRespostaItem,       { foreignKey: 'produtoId',      as: 'respostas' });
ChecklistItem.hasMany(ProdutoRespostaItem, { foreignKey: 'checklistItemId', as: 'respostas' });

module.exports = ProdutoRespostaItem;
