const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { createClient, getClients, getClientById, deleteClient } = require('../controllers/clientController');

router.post('/', [
  body('client_name').notEmpty().withMessage('Client name is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('requirement_type').notEmpty().withMessage('Requirement type is required'),
  body('property_type').notEmpty().withMessage('Property type is required'),
], createClient);

router.get('/', getClients);

router.get('/:id', getClientById);

router.delete('/:id', deleteClient);

module.exports = router;
