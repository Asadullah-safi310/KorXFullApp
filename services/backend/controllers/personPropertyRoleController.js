const { validationResult } = require('express-validator');
const { PersonPropertyRole, Person, Property } = require('../models');
const { sequelize } = require('../config/db');

const assignRoleToProperty = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { person_id, property_id, role, start_date, end_date } = req.body;

    const person = await Person.findByPk(person_id);
    if (!person) {
      return res.status(404).json({ error: 'Person not found' });
    }

    const property = await Property.findByPk(property_id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const roleRecord = await PersonPropertyRole.create({
      person_id,
      property_id,
      role,
      start_date,
      end_date,
    });

    res.status(201).json(roleRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getRolesByProperty = async (req, res) => {
  try {
    const { property_id } = req.params;

    const roles = await PersonPropertyRole.findAll({
      where: { property_id },
      include: [
        { model: Person, as: 'Person', attributes: ['person_id', 'full_name', 'phone', 'email'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getRolesByPerson = async (req, res) => {
  try {
    const { person_id } = req.params;

    const roles = await PersonPropertyRole.findAll({
      where: { person_id },
      include: [
        { model: Property, as: 'Property', attributes: ['property_id', 'property_type', 'location', 'city', 'sale_price', 'rent_price', 'status'] },
      ],
    });

    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getCurrentOwnerOfProperty = async (req, res) => {
  try {
    const { property_id } = req.params;

    const ownerRole = await PersonPropertyRole.findOne({
      where: {
        property_id,
        role: 'OWNER',
        end_date: null,
      },
      include: [
        { model: Person, as: 'Person', attributes: ['person_id', 'full_name', 'phone', 'email'] },
      ],
    });

    if (!ownerRole) {
      return res.json({ message: 'No current owner found' });
    }

    res.json(ownerRole);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getCurrentTenantOfProperty = async (req, res) => {
  try {
    const { property_id } = req.params;

    const tenantRole = await PersonPropertyRole.findOne({
      where: {
        property_id,
        role: 'TENANT',
        end_date: null,
      },
      include: [
        { model: Person, as: 'Person', attributes: ['person_id', 'full_name', 'phone', 'email'] },
      ],
    });

    if (!tenantRole) {
      return res.json({ message: 'No current tenant' });
    }

    res.json(tenantRole);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPropertyOwnershipHistory = async (req, res) => {
  try {
    const { property_id } = req.params;

    const history = await PersonPropertyRole.findAll({
      where: {
        property_id,
        role: 'OWNER',
      },
      include: [
        { model: Person, as: 'Person', attributes: ['person_id', 'full_name', 'phone', 'email'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateRole = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const { end_date, start_date } = req.body;

    const role = await PersonPropertyRole.findByPk(id);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    await role.update({ end_date, start_date });

    res.json(role);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    const role = await PersonPropertyRole.findByPk(id);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    await role.destroy();

    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  assignRoleToProperty,
  getRolesByProperty,
  getRolesByPerson,
  getCurrentOwnerOfProperty,
  getCurrentTenantOfProperty,
  getPropertyOwnershipHistory,
  updateRole,
  deleteRole,
};
