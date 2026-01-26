const { User, Property, Deal, Person, Province, District, Area } = require('../models');
const { Op } = require('sequelize');

// Get Dashboard Stats
exports.getDashboardStats = async (req, res) => {
  console.log('Fetching dashboard stats...');
  try {
    const totalUsers = await User.count();
    const totalAgents = await User.count({ where: { role: 'agent' } });
    const totalProperties = await Property.count();
    const totalDeals = await Deal.count();
    
    const propertiesForSale = await Property.count({ where: { is_available_for_sale: true } });
    const propertiesForRent = await Property.count({ where: { is_available_for_rent: true } });

    const stats = {
      totalUsers,
      totalAgents,
      totalProperties,
      totalDeals,
      propertiesForSale,
      propertiesForRent,
    };
    
    console.log('Dashboard Stats:', stats);
    res.json(stats);
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    res.status(500).json({ message: 'Error fetching dashboard stats', error: error.message });
  }
};

// Get All Users
exports.getUsers = async (req, res) => {
  console.log('Admin getUsers called');
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password_hash'] },
      order: [['createdAt', 'DESC']],
    });
    console.log(`Found ${users.length} users`);
    res.json(users);
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

// Get All Properties (Admin View)
exports.getAllProperties = async (req, res) => {
  try {
    const properties = await Property.findAll({
      include: [
        { model: Person, as: 'Owner', attributes: ['id', 'full_name', 'email'] },
        { model: User, as: 'Agent', attributes: ['user_id', 'full_name'] },
        { model: Province, as: 'ProvinceData' },
        { model: District, as: 'DistrictData' },
        { model: Area, as: 'AreaData' },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching properties', error: error.message });
  }
};

// Get All Deals (Admin View)
exports.getAllDeals = async (req, res) => {
  try {
    const deals = await Deal.findAll({
      include: [
        { model: Property, as: 'Property', include: [{ model: Person, as: 'Owner', attributes: ['full_name'] }] },
        { model: Person, as: 'Seller', attributes: ['id', 'full_name'] },
        { model: Person, as: 'Buyer', attributes: ['id', 'full_name'] },
        { model: User, as: 'Agent', attributes: ['user_id', 'full_name'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(deals);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching deals', error: error.message });
  }
};
