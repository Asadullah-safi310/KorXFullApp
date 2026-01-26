const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Client = sequelize.define('Client', {
  client_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  client_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  requirement_type: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  property_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  min_price: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: true,
  },
  max_price: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: true,
  },
  preferred_location: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, {
  tableName: 'clients',
  timestamps: true,
});

module.exports = Client;
