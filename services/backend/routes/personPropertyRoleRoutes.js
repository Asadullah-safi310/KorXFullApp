const express = require('express');
const { check } = require('express-validator');
const {
  assignRoleToProperty,
  getRolesByProperty,
  getRolesByPerson,
  getCurrentOwnerOfProperty,
  getCurrentTenantOfProperty,
  getPropertyOwnershipHistory,
  updateRole,
  deleteRole,
} = require('../controllers/personPropertyRoleController');

const router = express.Router();

router.post(
  '/',
  [
    check('person_id').notEmpty().isInt().withMessage('Person ID is required and must be an integer'),
    check('property_id').notEmpty().isInt().withMessage('Property ID is required and must be an integer'),
    check('role').notEmpty().isIn(['OWNER', 'TENANT']).withMessage('Role must be OWNER or TENANT'),
  ],
  assignRoleToProperty
);

router.get('/property/:property_id', getRolesByProperty);

router.get('/person/:person_id', getRolesByPerson);

router.get('/property/:property_id/current-owner', getCurrentOwnerOfProperty);

router.get('/property/:property_id/current-tenant', getCurrentTenantOfProperty);

router.get('/property/:property_id/history', getPropertyOwnershipHistory);

router.put(
  '/:id',
  [
    check('end_date').optional(),
    check('start_date').optional(),
  ],
  updateRole
);

router.delete('/:id', deleteRole);

module.exports = router;
