const { User, Property, Deal, Person, Province, District, Area } = require('../models');
const { sequelize } = require('../config/db');
const { Op } = require('sequelize');

// Get Dashboard Stats
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalAgents = await User.count({ where: { role: 'agent' } });
    const totalProperties = await Property.count();
    const totalActiveListings = await Property.count({ where: { status: 'available' } });
    const totalDeals = await Deal.count();
    
    const activeDeals = await Deal.count({ where: { status: 'active' } });
    const completedDeals = await Deal.count({ where: { status: 'completed' } });
    const canceledDeals = await Deal.count({ where: { status: 'canceled' } });

    const propertiesForSale = await Property.count({ where: { is_available_for_sale: true } });
    const propertiesForRent = await Property.count({ where: { is_available_for_rent: true } });

    // Recently added properties
    const recentProperties = await Property.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [
        { model: Person, as: 'Owner', attributes: ['full_name'] },
        { model: Province, as: 'ProvinceData', attributes: ['name'] }
      ]
    });

    // Recently created users
    const recentUsers = await User.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      attributes: ['user_id', 'full_name', 'email', 'role', 'createdAt']
    });

    const stats = {
      totalUsers,
      totalAgents,
      totalProperties,
      totalActiveListings,
      totalDeals,
      activeDeals,
      completedDeals,
      canceledDeals,
      propertiesForSale,
      propertiesForRent,
      recentProperties,
      recentUsers
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    res.status(500).json({ message: 'Error fetching dashboard stats', error: error.message });
  }
};

// Get All Users (with filters & pagination)
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search, status, id } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (id) where.user_id = id;
    if (role) where.role = role;
    if (status) where.status = status; // Assuming status exists in User model
    if (search) {
      where[Op.or] = [
        { full_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone_number: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { 
        exclude: ['password_hash'],
        include: [
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM Properties AS p
              WHERE p.agent_id = User.user_id
            )`),
            'property_count'
          ],
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM Deals AS d
              WHERE d.agent_user_id = User.user_id
            )`),
            'deal_count'
          ],
          [
            sequelize.literal(`(
              SELECT COALESCE(SUM(price), 0)
              FROM Deals AS d
              WHERE d.agent_user_id = User.user_id AND d.status = 'completed'
            )`),
            'total_volume'
          ]
        ]
      },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      total: count,
      pages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      users: rows
    });
  } catch (error) {
    console.error('Error in getUsers:', error);
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

// Update User Role
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!['admin', 'user', 'agent'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await user.update({ role });
    res.json({ message: 'User role updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user role', error: error.message });
  }
};

// Delete User
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await user.destroy();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};

// Get All Properties (Admin View with filters & pagination)
exports.getAllProperties = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      city, 
      province_id, 
      district_id, 
      purpose, 
      status,
      is_promoted,
      agent_id
    } = req.query;
    
    const offset = (page - 1) * limit;

    const where = {};
    if (city) where.city = city;
    if (province_id) where.province_id = province_id;
    if (district_id) where.district_id = district_id;
    if (status) where.status = status;
    if (is_promoted !== undefined) where.is_promoted = is_promoted === 'true';
    if (agent_id) {
      if (agent_id === 'none') where.agent_id = null;
      else where.agent_id = agent_id;
    }

    if (purpose) {
      if (purpose === 'SALE') where.is_available_for_sale = true;
      if (purpose === 'RENT') where.is_available_for_rent = true;
    }

    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { location: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Property.findAndCountAll({
      where,
      include: [
        { model: Person, as: 'Owner', attributes: ['id', 'full_name', 'email'] },
        { model: User, as: 'Agent', attributes: ['user_id', 'full_name'] },
        { model: Province, as: 'ProvinceData' },
        { model: District, as: 'DistrictData' },
        { model: Area, as: 'AreaData' },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      total: count,
      pages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      properties: rows
    });
  } catch (error) {
    console.error('Error in getAllProperties:', error);
    res.status(500).json({ message: 'Error fetching properties', error: error.message });
  }
};

// Get All Deals (Admin View with filters & pagination)
exports.getAllDeals = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      agent_id, 
      property_id,
      startDate,
      endDate
    } = req.query;
    
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (agent_id) where.agent_user_id = agent_id;
    if (property_id) where.property_id = property_id;

    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const { count, rows } = await Deal.findAndCountAll({
      where,
      include: [
        { model: Property, as: 'Property', include: [{ model: Person, as: 'Owner', attributes: ['full_name'] }] },
        { model: Person, as: 'Seller', attributes: ['id', 'full_name'] },
        { model: Person, as: 'Buyer', attributes: ['id', 'full_name'] },
        { model: User, as: 'Agent', attributes: ['user_id', 'full_name'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      total: count,
      pages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      deals: rows
    });
  } catch (error) {
    console.error('Error in getAllDeals:', error);
    res.status(500).json({ message: 'Error fetching deals', error: error.message });
  }
};
