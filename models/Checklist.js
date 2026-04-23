const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Checklist = sequelize.define('Checklist', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  codigo: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'Formato: CHK-01, CHK-02, ...',
  },
  nome: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  tipo: {
    type: DataTypes.ENUM('GERAL', 'ESPECIFICA'),
    allowNull: false,
    defaultValue: 'GERAL',
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  versao: {
    type: DataTypes.STRING(20),
    allowNull: true,
    defaultValue: '1.0',
  },
  status: {
    type: DataTypes.ENUM('ativo', 'inativo'),
    allowNull: false,
    defaultValue: 'ativo',
  },
}, {
  tableName: 'checklists',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['codigo'] },
  ],
});

module.exports = Checklist;
