const { validationResult } = require('express-validator');
const { Property, Deal, User, Person, Province, District, Area } = require('../models');
const { sequelize } = require('../config/db');
const { Op } = require('sequelize');
const path = require('path');
const PERMISSIONS = require('../constants/permissions');

// Helper to check permissions
const hasPermission = (user, permission) => {
  if (user.role === 'admin') return true;
  if (user.role === 'agent') {
    return true; // Simplified for now
  }
  return false;
};

const createProperty = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { 
      owner_person_id, 
      agent_id, 
      property_type, 
      purpose, 
      sale_price, 
      rent_price, 
      address, 
      province_id, 
      district_id, 
      area_id, 
      city, 
      area_size, 
      bedrooms, 
      bathrooms, 
      description, 
      latitude, 
      longitude,
      facilities,
      details,
      title,
      unit_number,
      floor,
      photos
    } = req.body;

    // Check if owner exists (if provided)
    if (owner_person_id) {
      const owner = await Person.findByPk(owner_person_id, { transaction });
      if (!owner) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Owner (Person) not found' });
      }
    }

    // Permission check
    if (!hasPermission(req.user, PERMISSIONS.NORMAL.CREATE)) {
      await transaction.rollback();
      return res.status(403).json({ error: 'Not authorized to create normal properties' });
    }

    // Validate required fields for standalone property
    if (!province_id || !district_id || !address) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Province, District, and Address are required for standalone properties' });
    }

    const property = await Property.create({
      owner_person_id: owner_person_id || null,
      agent_id: agent_id || null,
      created_by_user_id: req.user ? req.user.user_id : null,
      property_category: 'normal', // Force property_category to normal for standalone listings
      record_kind: 'listing', // Force record_kind to listing for standard property endpoint
      property_type,
      purpose,
      sale_price: sale_price || null,
      rent_price: rent_price || null,
      address,
      province_id: province_id || null,
      district_id: district_id || null,
      area_id: area_id || null,
      city,
      area_size,
      bedrooms,
      bathrooms,
      description,
      latitude: latitude || null,
      longitude: longitude || null,
      status: 'active',
      title,
      unit_number,
      floor,
      facilities: facilities || null,
      details: details || {},
      photos: photos || [],
      parent_id: null, // Force parent_id to null for standalone listings
      is_parent: false
    }, { transaction });

    await transaction.commit();
    res.status(201).json({ message: 'Property created successfully', property_id: property.property_id });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('Error creating property:', error);
    res.status(500).json({ error: error.message });
  }
};

const getProperties = async (req, res) => {
  try {
    const { limit, offset } = req.query;
    const where = {
      record_kind: 'listing' // Only show listings in property lists
    };
    
    // If not admin, filter by assigned agent or creator
    if (req.user && req.user.role !== 'admin') {
      where[Op.or] = [
        { agent_id: req.user.user_id },
        { created_by_user_id: req.user.user_id }
      ];
    }

    const properties = await Property.findAll({
      where,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
      order: [['createdAt', 'DESC']],
      include: [
        { model: Person, as: 'Owner', attributes: ['id', 'full_name', 'phone'] },
        { model: User, as: 'Agent', attributes: ['user_id', 'full_name', 'phone', 'profile_picture'] },
        { model: User, as: 'Creator', attributes: ['user_id', 'full_name', 'phone', 'profile_picture'] },
        { model: Province, as: 'ProvinceData', attributes: ['id', 'name'] },
        { model: District, as: 'DistrictData', attributes: ['id', 'name'] },
        { model: Area, as: 'AreaData', attributes: ['id', 'name'] },
        { model: Property, as: 'Parent', attributes: ['property_id', 'title', 'property_type', 'address'] },
      ],
    });

    const enrichedProperties = properties.map(prop => {
      const propJson = prop.toJSON();
      return {
        ...propJson,
        id: propJson.property_id,
        current_owner: propJson.Owner
      };
    });

    res.json(enrichedProperties);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;
    const property = await Property.findByPk(id, {
      include: [
        { model: Person, as: 'Owner', attributes: ['id', 'full_name', 'phone', 'email', 'address'] },
        { model: User, as: 'Agent', attributes: ['user_id', 'full_name', 'phone', 'email', 'profile_picture'] },
        { model: User, as: 'Creator', attributes: ['user_id', 'full_name', 'phone', 'email', 'profile_picture'] },
        { model: Province, as: 'ProvinceData', attributes: ['id', 'name'] },
        { model: District, as: 'DistrictData', attributes: ['id', 'name'] },
        { model: Area, as: 'AreaData', attributes: ['id', 'name'] },
        { model: Property, as: 'Parent', attributes: ['property_id', 'title', 'property_type', 'address'] },
      ],
    });

    if (!property || property.record_kind !== 'listing') {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // Check visibility/permissions
    if (req.user && req.user.role !== 'admin') {
      const isPublic = property.status === 'active';
      if (property.agent_id !== req.user.user_id && property.created_by_user_id !== req.user.user_id && !isPublic) {
        return res.status(403).json({ error: 'Not authorized to view this property' });
      }
    }

    const propJson = property.toJSON();
    const enrichedProperty = {
      ...propJson,
      id: propJson.property_id,
      current_owner: propJson.Owner
    };

    res.json(enrichedProperty);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const searchProperties = async (req, res) => {
  try {
    const { 
      city, 
      property_type, 
      purpose, 
      min_sale_price, 
      max_sale_price, 
      min_rent_price, 
      max_rent_price, 
      bedrooms, 
      status, 
      province_id,
      district_id,
      area_id,
      parent_id,
      search,
      limit, 
      offset 
    } = req.query;

    const andCriteria = [
      { record_kind: 'listing' } 
    ];

    if (search) {
      andCriteria.push({
        [Op.or]: [
          { title: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } },
          { address: { [Op.like]: `%${search}%` } },
          { '$Parent.title$': { [Op.like]: `%${search}%` } },
          { '$Parent.address$': { [Op.like]: `%${search}%` } },
        ]
      });
    }

    const publicCriteria = { status: 'active' };

    // Security Criteria
    if (!req.user || req.user.role !== 'admin') {
      if (req.user) {
        andCriteria.push({
          [Op.or]: [
            { agent_id: req.user.user_id },
            { created_by_user_id: req.user.user_id },
            publicCriteria
          ]
        });
      } else {
        andCriteria.push(publicCriteria);
      }
    }

    if (city) andCriteria.push({ city: { [Op.like]: `%${city}%` } });
    if (property_type) andCriteria.push({ property_type });
    if (parent_id) andCriteria.push({ parent_id });
    if (purpose) andCriteria.push({ purpose });
    if (province_id) andCriteria.push({ province_id });
    if (district_id) andCriteria.push({ district_id });
    if (area_id) andCriteria.push({ area_id });
    
    if (bedrooms) {
      if (bedrooms === '5') {
        andCriteria.push({ bedrooms: { [Op.gte]: 5 } });
      } else {
        andCriteria.push({ bedrooms });
      }
    }
    if (status) andCriteria.push({ status });
    
    if (min_sale_price || max_sale_price) {
      const salePriceFilter = {};
      if (min_sale_price) salePriceFilter[Op.gte] = min_sale_price;
      if (max_sale_price) salePriceFilter[Op.lte] = max_sale_price;
      andCriteria.push({ sale_price: salePriceFilter });
    }

    if (min_rent_price || max_rent_price) {
      const rentPriceFilter = {};
      if (min_rent_price) rentPriceFilter[Op.gte] = min_rent_price;
      if (max_rent_price) rentPriceFilter[Op.lte] = max_rent_price;
      andCriteria.push({ rent_price: rentPriceFilter });
    }

    const properties = await Property.findAll({ 
      where: andCriteria.length > 0 ? { [Op.and]: andCriteria } : {},
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
      order: [['createdAt', 'DESC']],
      include: [
        { model: Person, as: 'Owner', attributes: ['id', 'full_name', 'phone'] },
        { model: User, as: 'Agent', attributes: ['user_id', 'full_name', 'phone', 'profile_picture'] },
        { model: User, as: 'Creator', attributes: ['user_id', 'full_name', 'profile_picture'] },
        { model: Province, as: 'ProvinceData', attributes: ['id', 'name'] },
        { model: District, as: 'DistrictData', attributes: ['id', 'name'] },
        { model: Area, as: 'AreaData', attributes: ['id', 'name'] },
        { model: Property, as: 'Parent', attributes: ['property_id', 'title', 'property_type', 'address'] },
      ]
    });

    const enrichedProperties = properties.map(prop => {
      const propJson = prop.toJSON();
      return {
        ...propJson,
        id: propJson.property_id,
        current_owner: propJson.Owner
      };
    });

    res.json(enrichedProperties);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      owner_person_id, 
      agent_id, 
      property_type, 
      purpose, 
      sale_price, 
      rent_price, 
      address, 
      province_id, 
      district_id, 
      area_id, 
      city, 
      area_size, 
      bedrooms, 
      bathrooms, 
      description, 
      latitude, 
      longitude, 
      title, 
      unit_number,
      floor,
      facilities, 
      details,
      status
    } = req.body;

    const property = await Property.findByPk(id);
    if (!property || property.record_kind !== 'listing') {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // Check ownership
    if (req.user && req.user.user_id !== property.created_by_user_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this property' });
    }

    const isChild = !!property.parent_id;
    const isTowerUnit = isChild && property.property_category === 'tower';

    const updateData = {
      owner_person_id: owner_person_id !== undefined ? owner_person_id : property.owner_person_id,
      agent_id: agent_id !== undefined ? agent_id : property.agent_id,
      property_type: property_type !== undefined ? property_type : property.property_type,
      purpose: purpose !== undefined ? purpose : property.purpose,
      title: title !== undefined ? title : property.title,
      unit_number: unit_number !== undefined ? unit_number : property.unit_number,
      floor: floor !== undefined ? floor : property.floor,
      sale_price: sale_price !== undefined ? sale_price : property.sale_price,
      rent_price: rent_price !== undefined ? rent_price : property.rent_price,
      area_size: area_size !== undefined ? area_size : property.area_size,
      description: description !== undefined ? description : property.description,
      details: details !== undefined ? details : property.details,
      status: status !== undefined ? status : property.status
    };

    // Only update these if NOT a child listing (child listings inherit these)
    if (!isChild) {
      updateData.address = address !== undefined ? address : property.address;
      updateData.province_id = province_id !== undefined ? province_id : property.province_id;
      updateData.district_id = district_id !== undefined ? district_id : property.district_id;
      updateData.area_id = area_id !== undefined ? area_id : property.area_id;
      updateData.city = city !== undefined ? city : property.city;
      updateData.latitude = latitude !== undefined ? latitude : property.latitude;
      updateData.longitude = longitude !== undefined ? longitude : property.longitude;
      updateData.facilities = facilities !== undefined ? facilities : property.facilities;
    }

    // Handle Bedrooms/Bathrooms based on Tower rules
    if (isTowerUnit) {
      const activeType = property_type || property.property_type;
      if (activeType === 'apartment') {
        updateData.bedrooms = bedrooms !== undefined ? bedrooms : property.bedrooms;
        updateData.bathrooms = bathrooms !== undefined ? bathrooms : property.bathrooms;
      } else {
        // Force null for Office/Shop in Towers
        updateData.bedrooms = null;
        updateData.bathrooms = null;
      }
    } else {
      updateData.bedrooms = bedrooms !== undefined ? bedrooms : property.bedrooms;
      updateData.bathrooms = bathrooms !== undefined ? bathrooms : property.bathrooms;
    }

    await property.update(updateData);

    res.json({ message: 'Property updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;

    const property = await Property.findByPk(id);
    if (!property || property.record_kind !== 'listing') {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (req.user && req.user.user_id !== property.created_by_user_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this property' });
    }

    const dealCount = await Deal.count({ where: { property_id: id } });
    if (dealCount > 0) {
      return res.status(400).json({ error: 'Cannot delete property with existing deals' });
    }

    await property.destroy();
    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getMyProperties = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const properties = await Property.findAll({
      where: {
        record_kind: 'listing',
        [Op.or]: [
          { created_by_user_id: userId },
          { agent_id: userId }
        ]
      },
      include: [
        { model: Person, as: 'Owner', attributes: ['id', 'full_name', 'phone'] },
        { model: User, as: 'Agent', attributes: ['user_id', 'full_name', 'phone', 'profile_picture'] },
        { model: User, as: 'Creator', attributes: ['user_id', 'full_name', 'phone', 'profile_picture'] },
      ],
    });
    res.json(properties.map(p => ({ ...p.toJSON(), id: p.property_id })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const totalManaged = await Property.count({
      where: {
        record_kind: 'listing',
        [Op.or]: [
          { created_by_user_id: userId },
          { agent_id: userId }
        ]
      }
    });

    const totalActive = await Property.count({
      where: {
        record_kind: 'listing',
        status: 'active',
        [Op.or]: [
          { created_by_user_id: userId },
          { agent_id: userId }
        ]
      }
    });

    res.json({
      total_managed: totalManaged,
      total_active: totalActive
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Simplified upload/delete file functions (keeping logic but cleaning up)
const uploadFiles = async (req, res) => {
  try {
    const { id } = req.params;
    const property = await Property.findByPk(id);
    if (!property) return res.status(404).json({ error: 'Property not found' });

    const photos = [];
    if (req.files) {
      req.files.forEach(file => {
        photos.push(`/uploads/${file.filename}`);
      });
    }

    const existingPhotos = Array.isArray(property.photos) ? property.photos : [];
    await property.update({ photos: [...existingPhotos, ...photos] });

    res.json({ message: 'Files uploaded successfully', photos: property.photos });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPublicProperties = async (req, res) => {
  try {
    const { limit, offset } = req.query;
    const properties = await Property.findAll({
      where: {
        record_kind: 'listing',
        status: 'active'
      },
      limit: limit ? parseInt(limit) : 6,
      offset: offset ? parseInt(offset) : 0,
      order: [['createdAt', 'DESC']],
      include: [
        { model: Province, as: 'ProvinceData', attributes: ['name'] },
        { model: District, as: 'DistrictData', attributes: ['name'] },
        { model: Area, as: 'AreaData', attributes: ['name'] },
      ],
    });
    res.json(properties.map(p => ({ ...p.toJSON(), id: p.property_id })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPublicPropertiesByUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit, offset } = req.query;
    const properties = await Property.findAll({
      where: {
        record_kind: 'listing',
        status: 'active',
        [Op.or]: [
          { agent_id: id },
          { created_by_user_id: id }
        ]
      },
      limit: limit ? parseInt(limit) : 10,
      offset: offset ? parseInt(offset) : 0,
      order: [['createdAt', 'DESC']],
      include: [
        { model: Province, as: 'ProvinceData', attributes: ['name'] },
        { model: District, as: 'DistrictData', attributes: ['name'] },
      ],
    });
    res.json(properties.map(p => ({ ...p.toJSON(), id: p.property_id })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAvailableProperties = async (req, res) => {
  try {
    const properties = await Property.findAll({
      where: {
        record_kind: 'listing',
        status: 'active'
      },
      limit: 10,
      order: [['createdAt', 'DESC']]
    });
    res.json(properties.map(p => ({ ...p.toJSON(), id: p.property_id })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPropertiesByOwner = async (req, res) => {
  try {
    const { id } = req.params;
    const properties = await Property.findAll({
      where: {
        owner_person_id: id,
        record_kind: 'listing'
      }
    });
    res.json(properties.map(p => ({ ...p.toJSON(), id: p.property_id })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPropertyChildren = async (req, res) => {
  try {
    const { id } = req.params;
    const properties = await Property.findAll({
      where: {
        parent_id: id,
        record_kind: 'listing'
      },
      include: [
        { model: Province, as: 'ProvinceData', attributes: ['name'] },
        { model: District, as: 'DistrictData', attributes: ['name'] },
      ]
    });
    res.json(properties.map(p => ({ ...p.toJSON(), id: p.property_id })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updatePropertyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const property = await Property.findByPk(id);
    if (!property) return res.status(404).json({ error: 'Property not found' });
    await property.update({ status });
    res.json({ message: 'Property status updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updatePropertyAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_available_for_sale, is_available_for_rent } = req.body;
    const property = await Property.findByPk(id);
    if (!property) return res.status(404).json({ error: 'Property not found' });
    await property.update({ is_available_for_sale, is_available_for_rent });
    res.json({ message: 'Property availability updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteFile = async (req, res) => {
  try {
    const { id } = req.params;
    const { fileUrl } = req.body;
    const property = await Property.findByPk(id);
    if (!property) return res.status(404).json({ error: 'Property not found' });
    
    const photos = Array.isArray(property.photos) ? property.photos : [];
    const updatedPhotos = photos.filter(p => p !== fileUrl);
    await property.update({ photos: updatedPhotos });
    
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPropertiesByTenant = async (req, res) => {
  // Simplified for now, returning by owner if tenant logic is not fully defined
  try {
    const { id } = req.params;
    const properties = await Property.findAll({
      where: {
        owner_person_id: id,
        record_kind: 'listing'
      }
    });
    res.json(properties.map(p => ({ ...p.toJSON(), id: p.property_id })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const addChildProperty = async (req, res) => {
  // This is a bridge to the parentController logic if called via property routes
  const parentController = require('./parentController');
  return parentController.createChild(req, res);
};

module.exports = {
  createProperty,
  getProperties,
  getPropertyById,
  searchProperties,
  updateProperty,
  deleteProperty,
  getMyProperties,
  getDashboardStats,
  getPublicProperties,
  getPublicPropertiesByUser,
  getAvailableProperties,
  getPropertiesByOwner,
  getPropertyChildren,
  updatePropertyStatus,
  updatePropertyAvailability,
  deleteFile,
  getPropertiesByTenant,
  addChildProperty,
  uploadFiles
};
