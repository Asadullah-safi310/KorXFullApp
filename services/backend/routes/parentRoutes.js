const express = require('express');
const router = express.Router();
const parentController = require('../controllers/parentController');
const { protect } = require('../middleware/authMiddleware');

// Public routes (if any needed, e.g. public parent profile)
router.get('/parents/:id', parentController.getParentById);
router.get('/parents/:id/children', parentController.getParentChildren);

// Protected routes
router.post('/parents', protect, parentController.createParent);
router.get('/agent/parents', protect, parentController.getAgentParents);
router.post('/parents/:id/children', protect, parentController.createChild);
router.put('/parents/:id', protect, parentController.updateParent);
router.delete('/parents/:id', protect, parentController.deleteParent);

module.exports = router;
