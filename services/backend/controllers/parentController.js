const { Property, Province, District, Area, User } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { sequelize } = require('../config/db');
const PERMISSIONS = require('../constants/permissions');

// Helper to check permissions
const hasPermission = (user, permission) => {
  if (user.role === 'admin') return true;
  if (user.role === 'agent') {
    return true; // Simplified for now
  }
  return false;
};

const createParent = async (req, res) => {
  try {
    const {
      title,
      property_category,
      province_id,
      district_id,
      area_id,
      address,
      latitude,
      longitude,
      description,
      facilities,
      photos,
      details,
      owner_person_id,
      agent_id,
      total_floors,
      planned_units
    } = req.body;

    // Force property_category validation
    const allowedParentCategories = ['tower', 'market', 'sharak', 'apartment'];
    if (!allowedParentCategories.includes(property_category)) {
      return res.status(400).json({ error: 'Invalid parent category. Must be one of: tower, market, sharak' });
    }

    // Permission check
    const categoryKey = (property_category || '').toUpperCase();
    if (PERMISSIONS[categoryKey] && !hasPermission(req.user, PERMISSIONS[categoryKey].PARENT_CREATE)) {
      return res.status(403).json({ error: `Not authorized to create ${property_category} containers` });
    }

    const detailsObj = details || {};
    if (planned_units) {
      detailsObj.planned_units = Number(planned_units);
    }

    const parent = await Property.create({
      title,
      property_category,
      record_kind: 'container',
      is_parent: true,
      parent_id: null,
      property_type: 'apartment', // Default for containers, though not used much for them
      province_id,
      district_id,
      area_id,
      address,
      latitude,
      longitude,
      description,
      facilities,
      photos: photos || [],
      details: detailsObj,
      owner_person_id: owner_person_id || null,
      agent_id: agent_id || null,
      total_floors: total_floors || null,
      total_units: planned_units || null, // Keep for compatibility if needed, but primary is details
      created_by_user_id: req.user.user_id,
      status: 'active',
      purpose: null, // Containers must NOT be listed for sale/rent
      sale_price: null,
      rent_price: null
    });

    console.log('Parent container created successfully:', parent.property_id);
    res.status(201).json({ 
      message: 'Parent container created successfully', 
      property_id: parent.property_id,
      id: parent.property_id // For backward compatibility
    });
  } catch (error) {
    console.error('Error creating parent container:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.errors.map(e => e.message) });
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Unique constraint error' });
    }
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

const getAgentParents = async (req, res) => {
  try {
    const { category } = req.query;
    if (!category) {
      return res.status(400).json({ error: 'Category is required' });
    }

    // Permission check
    const permKey = category.toUpperCase();
    if (PERMISSIONS[permKey] && !hasPermission(req.user, PERMISSIONS[permKey].PARENT_READ)) {
      return res.status(403).json({ error: `Not authorized to read ${category} containers` });
    }

    const where = {
      property_category: category,
      record_kind: 'container',
      parent_id: null
    };

    if (req.user.role !== 'admin') {
      where.created_by_user_id = req.user.user_id;
    }

    const parents = await Property.findAll({
      where,
      include: [
        { model: Province, as: 'ProvinceData', attributes: ['name'] },
        { model: District, as: 'DistrictData', attributes: ['name'] },
        { model: Area, as: 'AreaData', attributes: ['name'] },
        { 
          model: Property, 
          as: 'Children', 
          attributes: ['property_id', 'status'] 
        }
      ],
      order: [['createdAt', 'DESC']],
    });

    // Enforce derived counts
    const enrichedParents = parents.map(parent => {
      const p = parent.toJSON();
      p.id = p.property_id;
      p.total_children = p.Children ? p.Children.length : 0;
      p.available_children = p.Children ? p.Children.filter(c => c.status === 'active').length : 0;
      delete p.Children;
      return p;
    });

    res.json(enrichedParents);
  } catch (error) {
    console.error('Error fetching agent containers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getParentById = async (req, res) => {
  try {
    const { id } = req.params;
    const parent = await Property.findByPk(id, {
      include: [
        { model: Province, as: 'ProvinceData', attributes: ['name'] },
        { model: District, as: 'DistrictData', attributes: ['name'] },
        { model: Area, as: 'AreaData', attributes: ['name'] },
        { model: User, as: 'Agent', attributes: ['full_name', 'email'] },
        { 
          model: Property, 
          as: 'Children', 
          attributes: ['property_id', 'status'] 
        }
      ],
    });

    if (!parent || parent.record_kind !== 'container') {
      return res.status(404).json({ error: 'Container not found' });
    }

    const parentJson = parent.toJSON();
    parentJson.id = parentJson.property_id;
    parentJson.total_children = parentJson.Children ? parentJson.Children.length : 0;
    parentJson.available_children = parentJson.Children ? parentJson.Children.filter(c => c.status === 'active').length : 0;
    delete parentJson.Children;

    res.json(parentJson);
  } catch (error) {
    console.error('Error fetching container details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getParentChildren = async (req, res) => {
  try {
    const { id } = req.params;
    const where = { 
      parent_id: id,
      record_kind: 'listing'
    };

    const children = await Property.findAll({
      where,
      include: [
        { model: Province, as: 'ProvinceData', attributes: ['name'] },
        { model: District, as: 'DistrictData', attributes: ['name'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    const enrichedChildren = children.map(child => {
      const c = child.toJSON();
      c.id = c.property_id;
      c.forSale = !!c.is_available_for_sale;
      c.forRent = !!c.is_available_for_rent;
      return c;
    });

    res.json(enrichedChildren);
  } catch (error) {
    console.error('Error fetching container units:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createChild = async (req, res) => {
  try {
    const { id } = req.params;
    const parent = await Property.findByPk(id);

    if (!parent || parent.record_kind !== 'container') {
      return res.status(404).json({ error: 'Parent container not found' });
    }

    const {
      title,
      property_type,
      description,
      photos,
      purpose,
      sale_price,
      rent_price,
      area_size,
      bedrooms,
      bathrooms,
      unit_number,
      floor,
      is_available_for_sale,
      is_available_for_rent,
      details
    } = req.body;

    // Allowed child types by parent category:
    // Market -> shop | office
    // Sharak -> apartment | shop | office | land | house
    // Tower -> apartment | shop | office
    const allowedTypes = {
      tower: ['apartment', 'shop', 'office'],
      apartment: ['apartment', 'shop', 'office'], // Alias for tower
      market: ['shop', 'office'],
      sharak: ['apartment', 'shop', 'office', 'land', 'house']
    };

    const parentCategory = (parent.property_category || '').toLowerCase();
    const typeLower = (property_type || '').toLowerCase();

    if (!allowedTypes[parentCategory] || !allowedTypes[parentCategory].includes(typeLower)) {
      return res.status(400).json({ 
        error: `Invalid unit type for ${parentCategory}. Allowed: ${allowedTypes[parentCategory].join(', ')}` 
      });
    }

    // Permission check
    const permKey = parentCategory.toUpperCase();
    if (PERMISSIONS[permKey] && !hasPermission(req.user, PERMISSIONS[permKey].CHILD_CREATE)) {
      return res.status(403).json({ error: `Not authorized to create ${parentCategory} units` });
    }

    const isTowerOrMarket = parentCategory === 'tower' || parentCategory === 'market';
    const activeBedrooms = (isTowerOrMarket && typeLower !== 'apartment') ? null : bedrooms;
    const activeBathrooms = (isTowerOrMarket && typeLower !== 'apartment') ? null : bathrooms;

    const child = await Property.create({
      parent_id: id,
      property_category: parentCategory,
      record_kind: 'listing',
      property_type: typeLower,
      title,
      description,
      photos: photos || [],
      purpose: purpose || 'sale',
      sale_price,
      rent_price,
      area_size: area_size || '0',
      bedrooms: activeBedrooms,
      bathrooms: activeBathrooms,
      unit_number,
      floor,
      is_available_for_sale: !!is_available_for_sale,
      is_available_for_rent: !!is_available_for_rent,
      details: details || {},
      created_by_user_id: req.user.user_id,
      status: 'active',
      // Inherit from parent
      province_id: parent.province_id,
      district_id: parent.district_id,
      area_id: parent.area_id,
      address: parent.address,
      latitude: parent.latitude,
      longitude: parent.longitude,
      city: parent.city,
      facilities: parent.facilities
    });

    const enrichedChild = await Property.findByPk(child.property_id, {
      include: [
        { model: Province, as: 'ProvinceData', attributes: ['name'] },
        { model: District, as: 'DistrictData', attributes: ['name'] },
      ]
    });

    res.status(201).json({
      message: 'Unit created successfully',
      property_id: child.property_id,
      id: child.property_id,
      property: enrichedChild
    });
  } catch (error) {
    console.error('Error creating unit:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.errors.map(e => e.message) });
    }
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

const updateParent = async (req, res) => {
  try {
    const { id } = req.params;
    const parent = await Property.findByPk(id);

    if (!parent || parent.record_kind !== 'container') {
      return res.status(404).json({ error: 'Container not found' });
    }

    if (req.user.role !== 'admin' && parent.created_by_user_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Not authorized to update this container' });
    }

    const {
      title,
      province_id,
      district_id,
      area_id,
      address,
      latitude,
      longitude,
      description,
      facilities,
      details,
      status,
      planned_units
    } = req.body;

    const detailsObj = details || parent.details || {};
    if (planned_units !== undefined) {
      detailsObj.planned_units = planned_units ? Number(planned_units) : null;
    }

    await parent.update({
      title,
      province_id,
      district_id,
      area_id,
      address,
      latitude,
      longitude,
      description,
      facilities,
      details: detailsObj,
      status: status || parent.status
    });

    const updatedParent = await Property.findByPk(id, {
      include: [
        { model: Province, as: 'ProvinceData', attributes: ['name'] },
        { model: District, as: 'DistrictData', attributes: ['name'] },
        { model: Area, as: 'AreaData', attributes: ['name'] },
        { model: User, as: 'Agent', attributes: ['full_name', 'email'] }
      ],
    });

    res.json(updatedParent);
  } catch (error) {
    console.error('Error updating container:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteParent = async (req, res) => {
  try {
    const { id } = req.params;
    const parent = await Property.findByPk(id);

    if (!parent || parent.record_kind !== 'container') {
      return res.status(404).json({ error: 'Container not found' });
    }

    if (req.user.role !== 'admin' && parent.created_by_user_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Not authorized to delete this container' });
    }

    const childCount = await Property.count({ where: { parent_id: id } });
    if (childCount > 0) {
      await parent.update({ status: 'inactive' });
      return res.json({ message: 'Container marked as inactive because it has units' });
    } else {
      await parent.destroy();
    }

    res.json({ message: 'Container deleted successfully' });
  } catch (error) {
    console.error('Error deleting container:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createParent,
  getAgentParents,
  getParentById,
  getParentChildren,
  createChild,
  updateParent,
  deleteParent
};
