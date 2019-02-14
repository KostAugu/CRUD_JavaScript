const express = require('express');
const router = express.Router();
const product_controller = require('../controllers/productController');

/* products routes. */
router.get('/', product_controller.product_list);
router.get('/create', product_controller.product_create_form);
router.post('/create', product_controller.product_create);
router.get('/:id', product_controller.product_details);
router.get('/:id/edit', product_controller.product_edit_form);
router.put('/:id/update', product_controller.product_update);
router.delete('/:id/delete', product_controller.product_delete);

module.exports = router;