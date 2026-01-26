const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Property = sequelize.define('Property', {
  property_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  owner_person_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Real person who owns the property',
  },
  agent_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Agent managing this property (User)',
  },
  created_by_user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'System User who created/added the property',
  },
  status: {
    type: DataTypes.ENUM('available', 'under_deal', 'unavailable'),
    defaultValue: 'available',
  },
  property_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  purpose: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  sale_price: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: true,
  },
  rent_price: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: true,
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
    comment: 'Full formatted address from Google Maps',
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  area_size: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  bedrooms: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  bathrooms: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
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
  photos: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  attachments: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  videos: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  is_available_for_sale: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  is_available_for_rent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  is_unavailable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  is_photo_available: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  is_attachment_available: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  is_video_available: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'properties',
  timestamps: true,
});

module.exports = Property;
