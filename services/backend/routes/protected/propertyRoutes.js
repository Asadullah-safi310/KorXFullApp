const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { 
  createProperty, 
  updateProperty, 
  updatePropertyStatus, 
  deleteProperty, 
  uploadFiles, 
  deleteFile, 
  getPropertiesByTenant, 
  updatePropertyAvailability,
  getMyProperties,
  getPropertyById,
  searchProperties,
  getDashboardStats,
  addChildProperty,
  getPropertyChildren
} = require('../../controllers/propertyController');
const { upload } = require('../../utils/upload');

router.get('/dashboard/stats', getDashboardStats);
router.get('/search', searchProperties);
router.get('/', getMyProperties);
router.get('/my-properties', getMyProperties);
router.get('/:id/children', getPropertyChildren);
router.get('/:id', getPropertyById); // Add this route to fetch single property for editing

router.post('/', [
  body('property_type').notEmpty().withMessage('Property type is required'),
  body('purpose').notEmpty().withMessage('Purpose is required'),
  body('province_id').notEmpty().withMessage('Province is required'),
  body('district_id').notEmpty().withMessage('District is required'),
  body('area_id').notEmpty().withMessage('Area is required'),
  body('area_size').notEmpty().withMessage('Area size is required'),
], createProperty);

router.get('/tenant/:id', getPropertiesByTenant);

router.put('/:id', [
  body('property_type').notEmpty().withMessage('Property type is required'),
  body('purpose').notEmpty().withMessage('Purpose is required'),
  body('province_id').notEmpty().withMessage('Province is required'),
  body('district_id').notEmpty().withMessage('District is required'),
  body('area_id').notEmpty().withMessage('Area is required'),
  body('area_size').notEmpty().withMessage('Area size is required'),
], updateProperty);

router.patch('/:id/status', updatePropertyStatus);
router.put('/:id/availability', updatePropertyAvailability);
router.post('/:id/children', addChildProperty);
router.post('/:id/upload', upload.array('files', 10), uploadFiles);
router.delete('/:id/file', deleteFile);
router.delete('/:id', deleteProperty);

module.exports = router;
