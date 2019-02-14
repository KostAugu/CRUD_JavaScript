const express = require('express');
const router = express.Router();
const inventory_controller = require('../controllers/inventoryController');

/* inventory routes. */
router.get('/', inventory_controller.inventory_list);
router.get('/create', inventory_controller.inventory_form_create);
router.post('/create', inventory_controller.inventory_create);
router.get('/:id', inventory_controller.inventory_detail);
router.get('/:id/edit', inventory_controller.inventory_edit_form);
router.put('/:id/update', inventory_controller.inventory_update);
router.delete('/:id/delete', inventory_controller.inventory_delete);

module.exports = router;