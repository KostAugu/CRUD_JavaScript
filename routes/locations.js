const express = require('express');
const router = express.Router();
const location_controller = require('../controllers/locationController');

/* locations routes. */
router.get('/', location_controller.location_list);
router.get('/create', location_controller.location_form_create);
router.post('/create', location_controller.location_create);
router.get('/:id', location_controller.location_details);
router.get('/:id/edit', location_controller.location_edit_form);
router.put('/:id/update', location_controller.location_update);
router.delete('/:id/delete', location_controller.location_delete);

module.exports = router;