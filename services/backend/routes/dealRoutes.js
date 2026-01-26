const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { createDeal, getDeals, getDealById } = require('../controllers/dealController');

router.post('/', [
  body('property_id').notEmpty().isInt().withMessage('Property ID is required and must be an integer'),
  body('deal_type').notEmpty().isIn(['SALE', 'RENT']).withMessage('Deal type must be SALE or RENT'),
  body('owner_id').notEmpty().isInt().withMessage('Owner ID is required and must be an integer'),
  body('buyer_id').notEmpty().isInt().withMessage('Buyer/Tenant ID is required and must be an integer'),
  body('start_date').optional({ checkFalsy: true }).isISO8601().withMessage('Start date must be a valid date'),
  body('price').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('notes').optional(),
], createDeal);

router.get('/', getDeals);

router.get('/:id', getDealById);

module.exports = router;
