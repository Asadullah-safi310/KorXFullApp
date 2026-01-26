const express = require('express');
const router = express.Router();
const { 
  getProperties, 
  getPropertyById, 
  searchProperties, 
  getAvailableProperties,
  getPropertiesByOwner,
  getPublicProperties,
  getPublicPropertiesByUser
} = require('../../controllers/propertyController');

router.get('/public', getPublicProperties);
router.get('/user/:id', getPublicPropertiesByUser);
router.get('/search', searchProperties);
router.get('/available', getAvailableProperties);
router.get('/owner/:id', getPropertiesByOwner);
router.get('/:id', getPropertyById);
router.get('/', getProperties);

module.exports = router;
