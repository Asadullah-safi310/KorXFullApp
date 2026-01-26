const { validationResult } = require('express-validator');
const { Owner, Property } = require('../models');

const createOwner = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { owner_name, phone, cnic, address } = req.body;
    await Owner.create({ owner_name, phone, cnic, address });
    res.status(201).json({ message: 'Owner created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getOwners = async (req, res) => {
  try {
    const owners = await Owner.findAll();
    res.json(owners);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getOwnerById = async (req, res) => {
  try {
    const { id } = req.params;
    const owner = await Owner.findByPk(id);

    if (!owner) {
      return res.status(404).json({ error: 'Owner not found' });
    }

    res.json(owner);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateOwner = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const { owner_name, phone, cnic, address } = req.body;
    
    const owner = await Owner.findByPk(id);
    if (!owner) {
      return res.status(404).json({ error: 'Owner not found' });
    }

    await owner.update({ owner_name, phone, cnic, address });
    res.json({ message: 'Owner updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteOwner = async (req, res) => {
  try {
    const { id } = req.params;
    const owner = await Owner.findByPk(id);

    if (!owner) {
      return res.status(404).json({ error: 'Owner not found' });
    }

    const propertyCount = await Property.count({ where: { owner_id: id } });
    if (propertyCount > 0) {
      return res.status(400).json({ error: 'Cannot delete owner with existing properties' });
    }

    await owner.destroy();
    res.json({ message: 'Owner deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createOwner, getOwners, getOwnerById, updateOwner, deleteOwner };
