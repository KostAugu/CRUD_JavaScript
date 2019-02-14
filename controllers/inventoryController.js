const Product = require('../models/product.model');
const Location = require('../models/location.model');
const Inventory = require('../models/inventory.model');
const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const async = require('async');

// Display all product in the inventory.
exports.inventory_list = function (req, res) {
  Inventory.find({}, 'product stock location')
    .populate('product')
    .populate('location')
    .exec(function (err, list_inventory) {
      if (err) { return next(err); }
      res.render('inventory_list', { title: 'Inventory List', inventory_list: list_inventory });
    });
};

// Display detail page for a specific product in the inventory.
exports.inventory_detail = function (req, res, next) {
  Inventory.findById(req.params.id)
    .populate('product')
    .populate('location')
    .exec(function (err, inventory) {
      if (err) { return next(err); }
      res.render('inventory_detail', { title: 'Product Details', inventory: inventory });
    });
};

// Display product create form.
exports.inventory_form_create = function (req, res) {
  // Get all products and locations
  async.parallel({
    products: function (callback) {
      Product.find(callback);
    },
    locations: function (callback) {
      Location.find(callback);
    },
  }, function (err, results) {
    if (err) { return next(err); }
    res.render('inventory_create_form', { title: 'Create Product in the Inventory', products: results.products, locations: results.locations });
  });
};

// Add product to database and display product detail page.
exports.inventory_create = [
  // Validate fields.
  body('product', 'Product must not be empty.').isLength({ min: 1 }).trim(),
  body('stock').isLength({ min: 1 }).trim().withMessage('Stock must be specified.').isInt().withMessage('Stock must be integer.'),
  body('location', 'Location must not be empty.').isLength({ min: 1 }).trim(),

  // Sanitize fields.
  sanitizeBody('*').trim().escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {

    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a Inventory object with escaped and trimmed data.
    var inventory = new Inventory(
      {
        product: req.body.product,
        stock: req.body.stock,
        location: req.body.location
      });
    if (!errors.isEmpty()) {
      // If there are errors, render form again with sanitized values/error messages.

      // Get all products and locations
      async.parallel({
        products: function (callback) {
          Product.find(callback);
        },
        locations: function (callback) {
          Location.find(callback);
        },
      }, function (err, results) {
        if (err) { return next(err); }
        res.render('inventory_create_form', { title: 'Create Product in the Inventory', products: results.products, locations: results.locations, inventory: inventory, errors: errors.array() });
      });
      return;
    }
    else {
      // If data from form is valid, add it to database.
      inventory.save(function (err) {
        if (err) { return next(err); }
        //successful - redirect to new product record.
        res.redirect(inventory.url);
      });
    }
  }
];

// Display product edit form.
exports.inventory_edit_form = function (req, res) {
  // Get all products and locations
  async.parallel({
    inventory: function (callback) {
      Inventory.findById(req.params.id).exec(callback);
    },
    products: function (callback) {
      Product.find(callback);
    },
    locations: function (callback) {
      Location.find(callback);
    },
  }, function (err, results) {
    if (err) { return next(err); }
    if (results.inventory == null) {
      var err = new Error('Product not found');
      err.status = 404;
      return next(err);
    }
    res.render('inventory_edit_form', { title: 'Edit Product in the Inventory', products: results.products, locations: results.locations, stock: results.inventory.stock, inventory: results.inventory });
  });
};

// Validate data, update database and display product detail page.
exports.inventory_update = [
  // Validate fields.
  body('product', 'Product must not be empty.').isLength({ min: 1 }).trim(),
  body('stock').isLength({ min: 1 }).trim().withMessage('Stock must be specified.').isInt().withMessage('Stock must be integer.'),
  body('location', 'Location must not be empty.').isLength({ min: 1 }).trim(),

  // Sanitize fields.
  sanitizeBody('*').trim().escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {

    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a Inventory object with escaped and trimmed data.
    var stock = req.body.stock;
    var inventory = new Inventory(
      {
        product: req.body.product,
        stock: stock,
        location: req.body.location,
        _id: req.params.id
      });
    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.

      // Get all products and locations
      async.parallel({
        products: function (callback) {
          Product.find(callback);
        },
        locations: function (callback) {
          Location.find(callback);
        },
      }, function (err, results) {
        if (err) { return next(err); }

        res.render('inventory_edit_form', { title: 'Edit Product in the Inventory', products: results.products, locations: results.locations, inventory: inventory, stock: stock, errors: errors.array() });
      });
      return;
    }
    else {
      // If data from form is valid, add it to database.
      Inventory.findByIdAndUpdate(req.params.id, inventory, {}, function (err, product) {
        if (err) { return next(err); }
        //successful - redirect to new product record.
        res.redirect(product.url);
      });
    }
  }
];

// Delete product from database and return to inventory
exports.inventory_delete = function (req, res) {
  Inventory.findByIdAndRemove(req.params.id, function deleteFromInventory(err) {
    if (err) { return next(err); }
    res.redirect('/inventory')
  })
};