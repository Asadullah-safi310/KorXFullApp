const { validationResult } = require('express-validator');
const { Property, Deal, User, Person, Province, District, Area } = require('../models');
const { sequelize } = require('../config/db');
const { Op } = require('sequelize');
const path = require('path');

const createProperty = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const transaction = await sequelize.transaction();

  try {
    const { 
      owner_person_id, 
      agent_id, 
      property_type, 
      purpose, 
      sale_price, 
      rent_price, 
      location, 
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
      is_available_for_sale, 
      is_available_for_rent, 
      is_unavailable,
      is_photo_available, 
      is_attachment_available, 
      is_video_available, 
      videos 
    } = req.body;

    // Check if owner exists (if provided)
    if (owner_person_id) {
      const owner = await Person.findByPk(owner_person_id, { transaction });
      if (!owner) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Owner (Person) not found' });
      }
    }

    const property = await Property.create({
      owner_person_id: owner_person_id || null,
      agent_id: agent_id || null,
      created_by_user_id: req.user ? req.user.user_id : null,
      property_type,
      purpose,
      sale_price: sale_price || null,
      rent_price: rent_price || null,
      location,
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
      status: 'available',
      is_available_for_sale: is_available_for_sale === true || is_available_for_sale === 'true' ? true : false,
      is_available_for_rent: is_available_for_rent === true || is_available_for_rent === 'true' ? true : false,
      is_unavailable: is_unavailable === true || is_unavailable === 'true' ? true : false,
      is_photo_available: is_photo_available === true || is_photo_available === 'true' ? true : false,
      is_attachment_available: is_attachment_available === true || is_attachment_available === 'true' ? true : false,
      is_video_available: is_video_available === true || is_video_available === 'true' ? true : false,
      videos: Array.isArray(videos) ? videos : [],
    }, { transaction });

    await transaction.commit();
    res.status(201).json({ message: 'Property created successfully', property_id: property.property_id });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ error: error.message });
  }
};

const getProperties = async (req, res) => {
  try {
    const { limit, offset } = req.query;
    const where = {};
    
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
      ],
    });

    const enrichedProperties = properties.map(prop => {
      const propJson = prop.toJSON();
      return {
        ...propJson,
        current_owner: propJson.Owner,
        is_available_for_sale: Boolean(propJson.is_available_for_sale),
        is_available_for_rent: Boolean(propJson.is_available_for_rent),
        is_photo_available: Boolean(propJson.is_photo_available),
        is_attachment_available: Boolean(propJson.is_attachment_available),
        is_video_available: Boolean(propJson.is_video_available),
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
      ],
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Check visibility/permissions
    if (req.user && req.user.role !== 'admin') {
      const isPublic = (property.is_available_for_sale || property.is_available_for_rent) && property.status === 'available';
      if (property.agent_id !== req.user.user_id && property.created_by_user_id !== req.user.user_id && !isPublic) {
        return res.status(403).json({ error: 'Not authorized to view this property' });
      }
    }

    const propJson = property.toJSON();
    const enrichedProperty = {
      ...propJson,
      current_owner: propJson.Owner,
      is_available_for_sale: Boolean(propJson.is_available_for_sale),
      is_available_for_rent: Boolean(propJson.is_available_for_rent),
      is_photo_available: Boolean(propJson.is_photo_available),
      is_attachment_available: Boolean(propJson.is_attachment_available),
      is_video_available: Boolean(propJson.is_video_available),
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
      availability, 
      agent_id, 
      created_by_user_id,
      province_id,
      district_id,
      area_id,
      limit, 
      offset 
    } = req.query;
    const andCriteria = [];

    const publicCriteria = { 
      [Op.or]: [
        { is_available_for_sale: true },
        { is_available_for_rent: true }
      ]
    };

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
    // if (purpose) andCriteria.push({ purpose }); // Purpose can be conflicting with availability
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
    if (agent_id) andCriteria.push({ agent_id });
    if (created_by_user_id) andCriteria.push({ created_by_user_id });
    
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

    if (availability === 'sale') {
      andCriteria.push({ is_available_for_sale: true });
    } else if (availability === 'rent') {
      andCriteria.push({ is_available_for_rent: true });
    } else if (availability === 'both') {
      andCriteria.push({
        [Op.or]: [
          { is_available_for_sale: true },
          { is_available_for_rent: true }
        ]
      });
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
      ]
    });

    const enrichedProperties = properties.map(prop => {
      const propJson = prop.toJSON();
      return {
        ...propJson,
        current_owner: propJson.Owner,
        is_available_for_sale: Boolean(propJson.is_available_for_sale),
        is_available_for_rent: Boolean(propJson.is_available_for_rent),
        is_photo_available: Boolean(propJson.is_photo_available),
        is_attachment_available: Boolean(propJson.is_attachment_available),
        is_video_available: Boolean(propJson.is_video_available),
      };
    });

    res.json(enrichedProperties);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateProperty = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const { owner_person_id, agent_id, property_type, purpose, sale_price, rent_price, location, address, province_id, district_id, area_id, city, area_size, bedrooms, bathrooms, description, latitude, longitude, is_available_for_sale, is_available_for_rent, is_unavailable, is_photo_available, is_attachment_available, is_video_available } = req.body;

    const property = await Property.findByPk(id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Check ownership
    if (req.user && req.user.user_id !== property.created_by_user_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this property' });
    }

    await property.update({
      owner_person_id: owner_person_id !== undefined ? owner_person_id : property.owner_person_id,
      agent_id: agent_id !== undefined ? agent_id : property.agent_id,
      property_type,
      purpose,
      sale_price: sale_price || null,
      rent_price: rent_price || null,
      location,
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
      is_available_for_sale: is_available_for_sale === true || is_available_for_sale === 'true' ? true : false,
      is_available_for_rent: is_available_for_rent === true || is_available_for_rent === 'true' ? true : false,
      is_unavailable: is_unavailable === true || is_unavailable === 'true' ? true : false,
      is_photo_available: is_photo_available === true || is_photo_available === 'true' ? true : false,
      is_attachment_available: is_attachment_available === true || is_attachment_available === 'true' ? true : false,
      is_video_available: is_video_available === true || is_video_available === 'true' ? true : false,
    });

    res.json({ message: 'Property updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updatePropertyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const property = await Property.findByPk(id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Check ownership
    if (req.user && req.user.user_id !== property.created_by_user_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this property status' });
    }

    await property.update({ status });
    res.json({ message: 'Property status updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;

    const property = await Property.findByPk(id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Check ownership
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

const uploadFiles = async (req, res) => {
  try {
    const { id } = req.params;

    const property = await Property.findByPk(id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Check ownership
    if (req.user && req.user.user_id !== property.created_by_user_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to upload files to this property' });
    }

    const photos = [];
    const videos = [];
    const attachments = [];

    if (req.files) {
      req.files.forEach(file => {
        const fileUrl = `/uploads/${file.filename}`;
        if (file.mimetype.startsWith('image/')) {
          photos.push(fileUrl);
        } else if (file.mimetype.startsWith('video/')) {
          videos.push(fileUrl);
        } else {
          attachments.push(fileUrl);
        }
      });
    }

    const existingPhotos = Array.isArray(property.photos) ? property.photos : [];
    const existingVideos = Array.isArray(property.videos) ? property.videos : [];
    const existingAttachments = Array.isArray(property.attachments) ? property.attachments : [];

    const updateData = {
      photos: [...existingPhotos, ...photos],
      videos: [...existingVideos, ...videos],
      attachments: [...existingAttachments, ...attachments],
    };

    if (photos.length > 0) updateData.is_photo_available = true;
    if (videos.length > 0) updateData.is_video_available = true;
    if (attachments.length > 0) updateData.is_attachment_available = true;

    await property.update(updateData);

    const updatedProperty = await Property.findByPk(id);

    res.json({
      message: 'Files uploaded successfully',
      photos: updatedProperty.photos,
      videos: updatedProperty.videos,
      attachments: updatedProperty.attachments,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteFile = async (req, res) => {
  try {
    const { id } = req.params;
    const { fileUrl, type } = req.body;

    const property = await Property.findByPk(id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Check ownership
    if (req.user && req.user.user_id !== property.created_by_user_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete files from this property' });
    }

    if (type === 'photo') {
      property.photos = Array.isArray(property.photos)
        ? property.photos.filter(f => f !== fileUrl)
        : [];
    } else if (type === 'video') {
      property.videos = Array.isArray(property.videos)
        ? property.videos.filter(f => f !== fileUrl)
        : [];
    } else if (type === 'attachment') {
      property.attachments = Array.isArray(property.attachments)
        ? property.attachments.filter(f => f !== fileUrl)
        : [];
    }

    await property.save();

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAvailableProperties = async (req, res) => {
  try {
    const { dealType } = req.query;
    const where = {};

    // If not admin, filter by assigned agent or creator
    if (req.user && req.user.role !== 'admin') {
      where[Op.and] = [
        {
          [Op.or]: [
            { agent_id: req.user.user_id },
            { created_by_user_id: req.user.user_id }
          ]
        }
      ];
    }

    if (dealType === 'SALE') {
      where.is_available_for_sale = true;
    } else if (dealType === 'RENT') {
      where.is_available_for_rent = true;
    } else {
      where[Op.or] = [
        { is_available_for_sale: true },
        { is_available_for_rent: true }
      ];
    }

    const properties = await Property.findAll({
      where,
      include: [
        { model: Person, as: 'Owner', attributes: ['id', 'full_name', 'phone'] },
        { model: User, as: 'Agent', attributes: ['user_id', 'full_name', 'phone', 'profile_picture'] },
        { model: User, as: 'Creator', attributes: ['user_id', 'full_name', 'phone', 'profile_picture'] },
      ],
    });

    const enrichedProperties = properties.map(prop => {
      const propJson = prop.toJSON();
      return {
        ...propJson,
        current_owner: propJson.Owner,
        is_available_for_sale: Boolean(propJson.is_available_for_sale),
        is_available_for_rent: Boolean(propJson.is_available_for_rent),
      };
    });

    res.json(enrichedProperties);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPropertiesByOwner = async (req, res) => {
  try {
    const { id } = req.params;

    const properties = await Property.findAll({
      where: { owner_person_id: id },
      include: [
        { model: Person, as: 'Owner', attributes: ['id', 'full_name', 'phone'] },
        { model: User, as: 'Agent', attributes: ['user_id', 'full_name', 'phone', 'profile_picture'] },
        { model: User, as: 'Creator', attributes: ['user_id', 'full_name', 'phone', 'profile_picture'] },
      ],
    });

    res.json(properties);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPropertiesByTenant = async (req, res) => {
  try {
    const { id } = req.params;

    const deals = await Deal.findAll({
      where: {
        buyer_person_id: id,
        deal_type: 'RENT',
      },
      include: [
        {
          model: Property,
          as: 'Property',
          include: [
            { model: Person, as: 'Owner', attributes: ['id', 'full_name', 'phone'] },
            { model: User, as: 'Agent', attributes: ['user_id', 'full_name', 'phone', 'profile_picture'] },
            { model: User, as: 'Creator', attributes: ['user_id', 'full_name', 'profile_picture'] },
          ],
        },
      ],
    });

    const properties = deals.map(deal => deal.Property).filter(prop => prop);

    res.json(properties);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updatePropertyAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_available_for_sale, is_available_for_rent } = req.body;

    const property = await Property.findByPk(id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Check ownership or assignment
    if (req.user && req.user.user_id !== property.created_by_user_id && req.user.user_id !== property.agent_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this property availability' });
    }

    const updateData = {};
    if (is_available_for_sale !== undefined) updateData.is_available_for_sale = is_available_for_sale;
    if (is_available_for_rent !== undefined) updateData.is_available_for_rent = is_available_for_rent;

    await property.update(updateData);
    res.json({ message: 'Property availability updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getMyProperties = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const properties = await Property.findAll({
      where: {
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
    res.json(properties);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


const getPublicProperties = async (req, res) => {
  try {
    const { limit, offset } = req.query;
    const properties = await Property.findAll({
      where: {
        [Op.or]: [
          { is_available_for_sale: true },
          { is_available_for_rent: true }
        ]
      },
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
      order: [['createdAt', 'DESC']],
      include: [
        { model: Person, as: 'Owner', attributes: ['id', 'full_name', 'phone'] },
        { model: User, as: 'Agent', attributes: ['user_id', 'full_name', 'phone', 'profile_picture'] },
        { model: User, as: 'Creator', attributes: ['user_id', 'full_name', 'profile_picture'] },
      ],
    });

    const enrichedProperties = properties.map(prop => {
      const propJson = prop.toJSON();
      return {
        ...propJson,
        current_owner: propJson.Owner,
        is_available_for_sale: Boolean(propJson.is_available_for_sale),
        is_available_for_rent: Boolean(propJson.is_available_for_rent),
        is_photo_available: Boolean(propJson.is_photo_available),
        is_attachment_available: Boolean(propJson.is_attachment_available),
        is_video_available: Boolean(propJson.is_video_available),
      };
    });

    res.json(enrichedProperties);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const totalManaged = await Property.count({
      where: {
        [Op.or]: [
          { created_by_user_id: userId },
          { agent_id: userId }
        ]
      }
    });

    const totalAssigned = await Property.count({
      where: { agent_id: userId }
    });

    const totalListed = await Property.count({
      where: { created_by_user_id: userId }
    });

    const publicListings = await Property.count({
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              { created_by_user_id: userId },
              { agent_id: userId }
            ]
          },
          {
            [Op.or]: [
              { is_available_for_sale: true },
              { is_available_for_rent: true }
            ]
          }
        ]
      }
    });

    const forSale = await Property.count({
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              { created_by_user_id: userId },
              { agent_id: userId }
            ]
          },
          { is_available_for_sale: true }
        ]
      }
    });

    const forRent = await Property.count({
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              { created_by_user_id: userId },
              { agent_id: userId }
            ]
          },
          { is_available_for_rent: true }
        ]
      }
    });

    let activeDeals = 0;
    if (req.user.role === 'agent') {
      activeDeals = await Deal.count({
        where: {
          agent_user_id: userId,
          status: 'completed'
        }
      });
    }

    res.json({
      total_managed: totalManaged,
      total_assigned: totalAssigned,
      total_listed: totalListed,
      public_listings: publicListings,
      for_sale: forSale,
      for_rent: forRent,
      active_deals: activeDeals
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPublicPropertiesByUser = async (req, res) => {
  try {
    const { id } = req.params;

    // First find the user to check their role
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const where = {
      [Op.or]: [
        { is_available_for_sale: true },
        { is_available_for_rent: true }
      ]
    };

    if (user.role === 'agent') {
      // For Agent: Created by this agent OR Assigned to this agent
      where[Op.and] = [
        {
          [Op.or]: [
            { created_by_user_id: id },
            { agent_id: id }
          ]
        }
      ];
    } else {
      // For User: Only created by this user
      where.created_by_user_id = id;
    }

    const properties = await Property.findAll({
      where,
      include: [
        { model: Person, as: 'Owner', attributes: ['id', 'full_name', 'phone'] },
        { model: User, as: 'Agent', attributes: ['user_id', 'full_name', 'phone', 'profile_picture'] },
        { model: User, as: 'Creator', attributes: ['user_id', 'full_name', 'profile_picture'] },
      ],
    });

    const enrichedProperties = properties.map(prop => {
      const propJson = prop.toJSON();
      return {
        ...propJson,
        current_owner: propJson.Owner,
        is_available_for_sale: Boolean(propJson.is_available_for_sale),
        is_available_for_rent: Boolean(propJson.is_available_for_rent),
        is_photo_available: Boolean(propJson.is_photo_available),
        is_attachment_available: Boolean(propJson.is_attachment_available),
        is_video_available: Boolean(propJson.is_video_available),
      };
    });

    res.json(enrichedProperties);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createProperty,
  getProperties,
  getPropertyById,
  searchProperties,
  getPublicProperties,
  getPublicPropertiesByUser,
  getDashboardStats,
  updateProperty,
  updatePropertyStatus,
  deleteProperty,
  uploadFiles,
  deleteFile,
  getAvailableProperties,
  getPropertiesByOwner,
  getPropertiesByTenant,
  updatePropertyAvailability,
  getMyProperties,
};
