const Location = require('../models/location.model');
const Inventory = require('../models/inventory.model');
const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const NodeGeocoder = require('node-geocoder');
const geocoder = NodeGeocoder({
  provider: 'opencage',
  apiKey: '0787a41854b746ebb6f419fcd0ee2d23'
});
const async = require('async');
const XRegExp = require('xregexp');

// Display list of all locations.
exports.location_list = function (req, res) {
  Location.find({}, 'country city street latitude longitude')
    .exec(function (err, list_location) {
      if (err) { return next(err); }
      //Successful, so render
      res.render('location_list', { title: 'Location List', location_list: list_location });
    });
};

// Display detail page for a specific location.
exports.location_details = function (req, res, next) {
  Location.findById(req.params.id)
    .exec(function (err, location) {
      if (err) { return next(err); } // Error in API usage.
      if (location == null) { // No results.
        var err = new Error('Location not found');
        err.status = 404;
        return next(err);
      }
      // Successful, so render.
      res.render('location_detail', { title: 'Location Detail', location: location });
    });
};

// Display location create form.
exports.location_form_create = function (req, res) {
  res.render('location_create_form', { title: 'Create Location' });
};

// Add location to database and display location detail page.
exports.location_create = [
  // Validate fields.
  body('country').isLength({ min: 1 }).trim().withMessage('Country must be specified.').custom((value) => XRegExp('^\\pL+$').test(value) ? true : false).withMessage('Country has non alphabetic characters.'),
  body('city').isLength({ min: 1 }).trim().withMessage('City must be specified.').custom((value) => XRegExp('^\\pL+$').test(value) ? true : false).withMessage('City has non alphabetic characters.'),
  body('street').isLength({ min: 1 }).trim().withMessage('Street must be specified.').custom((value) => XRegExp('^(\\pL|[0-9_]|\\s|.|,|-)+$').test(value) ? true : false).withMessage('Street format is not correct.'),

  // Sanitize fields.
  sanitizeBody('country').trim().escape(),
  sanitizeBody('city').trim().escape(),
  sanitizeBody('street').trim().escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {

    // Extract the validation errors from a request.
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/errors messages.          
      res.render('location_create_form', { title: 'Create Location', location: req.body, errors: errors.array() });
      return;
    } else {
      // Data from form is valid.     
      // location
      var address = req.body.country + " " + req.body.city + " " + req.body.street;
      geocoder.geocode(address, function (err, geoRes) {
        // Create an Location object with escaped and trimmed data.
        var location = new Location(
          {
            country: req.body.country,
            city: req.body.city,
            street: req.body.street,
            latitude: geoRes[0].latitude,
            longitude: geoRes[0].longitude
          });
        location.save(function (err) {
          if (err) { return next(err); }
          // Successful - redirect to new location record.
          res.redirect(location.url);
        });
      });
    }
  }
];

// Display location edit form.
exports.location_edit_form = function (req, res) {
  Location.findById(req.params.id)
    .exec(function (err, location) {
      if (err) { return next(err); } // Error in API usage.
      if (location == null) { // No results.
        var err = new Error('Location not found');
        err.status = 404;
        return next(err);
      }
      res.render('location_edit_form', { title: 'Location Edit Form', location: location });
    });
};

// Validate data, update database and display location detail page.
exports.location_update = [
  // Validate fields.
  body('country').isLength({ min: 1 }).trim().withMessage('Country must be specified.').custom((value) => XRegExp('^\\pL+$').test(value) ? true : false).withMessage('Country has non alphabetic characters.'),
  body('city').isLength({ min: 1 }).trim().withMessage('City must be specified.').custom((value) => XRegExp('^\\pL+$').test(value) ? true : false).withMessage('City has non alphabetic characters.'),
  body('street').isLength({ min: 1 }).trim().withMessage('Street must be specified.').custom((value) => XRegExp('^(\\pL|[0-9_]|\\s|.|,|-)+$').test(value) ? true : false).withMessage('Street format is not correct.'),

  // Sanitize fields.
  sanitizeBody('country').trim().escape(),
  sanitizeBody('city').trim().escape(),
  sanitizeBody('street').trim().escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/errors messages.          
      res.render('location_edit_form', { title: 'Location Edit Form', location: req.body, url: '/locations/' + req.params.id, errors: errors.array() });
      return;
    } else {
      // location
      var address = req.body.country + " " + req.body.city + " " + req.body.street;
      geocoder.geocode(address, function (err, geoRes) {
        // Create an Location object with escaped/trimmed data and old id.
        var location = new Location(
          {
            country: req.body.country,
            city: req.body.city,
            street: req.body.street,
            latitude: geoRes[0].latitude,
            longitude: geoRes[0].longitude,
            _id: req.params.id
          });
        // Data from form is valid.  
        Location.findByIdAndUpdate(req.params.id, location, {}, function (err, location) {
          if (err) { return next(err); }
          // Successful - redirect to location detail page.
          res.redirect(location.url);
        });
      });
    }
  }
];

// Check if there is no products with this location in the inventory, if not delete it
exports.location_delete = function (req, res, next) {
  async.parallel({
    location: function (callback) {
      Location.findById(req.params.id).exec(callback)
    },
    inventory_products: function (callback) {
      Inventory.find({ 'location': req.params.id }).exec(callback)
    },
  }, function (err, results) {
    if (err) { return next(err); }
    if (results.inventory_products.length > 0) {
      // Inventory has this product. 
      res.render('location_delete', { title: 'Cannot Delete Location', location: results.location, inventory_products: results.inventory_products });
      return;
    }
    else {
      // Products are not in this location. Delete object and redirect to the list of locations.
      Location.findByIdAndRemove(req.params.id, function deleteLocation(err) {
        if (err) { return next(err); }
        res.redirect('/locations')
      })
    }
  });
};