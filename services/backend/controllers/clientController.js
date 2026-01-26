const { validationResult } = require('express-validator');
const { Client } = require('../models');

const createClient = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { client_name, phone, requirement_type, property_type, min_price, max_price, preferred_location } = req.body;
    await Client.create({
      client_name,
      phone,
      requirement_type,
      property_type,
      min_price,
      max_price,
      preferred_location,
    });
    res.status(201).json({ message: 'Client created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getClients = async (req, res) => {
  try {
    const clients = await Client.findAll();
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getClientById = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await Client.findByPk(id);

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(client);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await Client.findByPk(id);

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    await client.destroy();
    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createClient, getClients, getClientById, deleteClient };
