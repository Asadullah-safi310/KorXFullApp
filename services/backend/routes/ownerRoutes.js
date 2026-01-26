const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { createOwner, getOwners, getOwnerById, updateOwner, deleteOwner } = require('../controllers/ownerController');

router.post('/', [
  body('owner_name').notEmpty().withMessage('Owner name is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
], createOwner);

router.get('/', getOwners);

router.get('/:id', getOwnerById);

router.put('/:id', [
  body('owner_name').notEmpty().withMessage('Owner name is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
], updateOwner);

router.delete('/:id', deleteOwner);

module.exports = router;
