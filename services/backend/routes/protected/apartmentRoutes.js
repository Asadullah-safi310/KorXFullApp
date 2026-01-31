const express = require('express');
const router = express.Router();
const apartmentController = require('../../controllers/apartmentController');
const { body } = require('express-validator');
const { upload } = require('../../utils/upload');

// Test route
router.get('/test-protected', (req, res) => {
  res.json({ message: 'Apartment Protected Router is active' });
});

router.get('/my', apartmentController.getAgentApartments);

// CRUD on specific ID
router.get('/:id', apartmentController.getApartmentById);
router.put('/:id', apartmentController.updateApartment);
router.delete('/:id', apartmentController.deleteApartment);

router.post(
  '/',
  [
    body('apartment_name').notEmpty().withMessage('Apartment name is required'),
  ],
  apartmentController.createApartment
);

router.post('/:id/upload', upload.array('files', 10), apartmentController.uploadApartmentFiles);
router.delete('/:id/file', apartmentController.deleteApartmentFile);

module.exports = router;
