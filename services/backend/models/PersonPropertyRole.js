const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const PersonPropertyRole = sequelize.define('PersonPropertyRole', {
  role_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  person_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  property_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('OWNER', 'TENANT'),
    allowNull: false,
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'person_property_roles',
  timestamps: true,
});

module.exports = PersonPropertyRole;
