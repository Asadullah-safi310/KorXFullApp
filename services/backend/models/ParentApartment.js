const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ParentApartment = sequelize.define('ParentApartment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  apartment_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  province_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'provinces',
      key: 'id',
    },
  },
  district_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'districts',
      key: 'id',
    },
  },
  area_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'areas',
      key: 'id',
    },
  },
  address: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
  },
  total_floors: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  total_units: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  facilities: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'JSON object containing lift, parking, generator, security, solar, etc.',
  },
  building_images: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'user_id',
    },
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
  },
}, {
  tableName: 'parent_apartments',
  timestamps: true,
});

module.exports = ParentApartment;
