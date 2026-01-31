const express = require('express');
const router = express.Router();
const apartmentController = require('../../controllers/apartmentController');
const { body } = require('express-validator');
const { upload } = require('../../utils/upload');

// Public routes for apartments
router.get('/', apartmentController.getApartments);
router.get('/:id', apartmentController.getApartmentById);
router.get('/:id/properties', apartmentController.getApartmentUnits);

module.exports = router;
