const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getUsers,
  updateUserRole,
  deleteUser,
  getAllProperties,
  getAllDeals,
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

// Publicly accessible stats for all authenticated users
router.use(protect);
router.get('/stats', getDashboardStats);

// Admin-only routes
router.use(admin);

router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);
router.get('/properties', getAllProperties);
router.get('/deals', getAllDeals);

module.exports = router;
