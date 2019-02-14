const Product = require('../models/product.model');
const Inventory = require('../models/inventory.model');
const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const async = require('async');
const XRegExp = require('xregexp');

// Display list of all products.
exports.product_list = function (req, res) {
    Product.find({}, 'title description price')
        .exec(function (err, list_product) {
            if (err) { return next(err); }
            //Successful, so render
            res.render('product_list', { title: 'Product List', product_list: list_product });
        });
};

// Display detail page for a specific product.
exports.product_details = function (req, res) {
    Product.findById(req.params.id)
        .exec(function (err, product) {
            if (err) { return next(err); } // Error in API usage.
            if (product == null) { // No results.
                var err = new Error('Product not found');
                err.status = 404;
                return next(err);
            }
            // Successful, so render.
            res.render('product_detail', { title: 'Product Detail', product: product });
        });
};

// Display product create form.
exports.product_create_form = function (req, res) {
    res.render('product_create_form', { title: 'Create Product' });
};

// Add product to database and display product detail page.
exports.product_create = [
    // Validate fields.
    body('title').isLength({ min: 1 }).trim().withMessage('Title must be specified.').custom((value) => XRegExp('^(\\pL|\\s)+$').test(value) ? true : false).withMessage('Title has non alphabetic characters.'),
    body('description').isLength({ min: 1 }).trim().withMessage('Description must be specified.').custom((value) => XRegExp('^(\\pL|[0-9_]|\\s|.|,|-)+$').test(value) ? true : false).withMessage('Description contains unallowed characters.'),
    body('price').isLength({ min: 1 }).trim().withMessage('Price must be specified.').isFloat().withMessage('Price format is not correct.'),

    // Sanitize fields.
    sanitizeBody('title').trim().escape(),
    sanitizeBody('description').trim().escape(),
    sanitizeBody('price').trim().escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/errors messages.          
            res.render('product_create_form', { title: 'Create Product', product: req.body, errors: errors.array() });
            return;
        } else {
            // Data from form is valid.     

            // Create an Product object with escaped and trimmed data.
            var product = new Product(
                {
                    title: req.body.title,
                    description: req.body.description,
                    price: req.body.price
                });
            product.save(function (err) {
                if (err) { return next(err); }
                // Successful - redirect to new product record.
                res.redirect(product.url);
            });
        }
    }
];

// Display product edit form.
exports.product_edit_form = function (req, res) {
    Product.findById(req.params.id)
        .exec(function (err, product) {
            if (err) { return next(err); } // Error in API usage.
            if (product == null) { // No results.
                var err = new Error('Product not found');
                err.status = 404;
                return next(err);
            }
            // Successful, so render.
            res.render('product_edit_form', { title: 'Product Edit Form', product: product });
        });
};

// Validate data, update database and display product detail page.
exports.product_update = [
    // Validate fields.
    body('title').isLength({ min: 1 }).trim().withMessage('Title must be specified.').custom((value) => XRegExp('^(\\pL|\\s)+$').test(value) ? true : false).withMessage('Title has non alphabetic characters.'),
    body('description').isLength({ min: 1 }).trim().withMessage('Description must be specified.').custom((value) => XRegExp('^(\\pL|[0-9_]|\\s|.|,|-)+$').test(value) ? true : false).withMessage('Description contains unallowed characters.'),
    body('price').isLength({ min: 1 }).trim().withMessage('Price must be specified.').isFloat().withMessage('Price format is not correct.'),

    // Sanitize fields.
    sanitizeBody('title').trim().escape(),
    sanitizeBody('description').trim().escape(),
    sanitizeBody('price').trim().escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);
        // Create an Product object with escaped/trimmed data and old id.
        var product = new Product(
            {
                title: req.body.title,
                description: req.body.description,
                price: req.body.price,
                _id: req.params.id
            });
        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/errors messages.          
            res.render('product_edit_form', { title: 'Product Edit Form', product: req.body, url: product.url, errors: errors.array() });
            return;
        } else {
            // Data from form is valid.  
            Product.findByIdAndUpdate(req.params.id, product, {}, function (err, product) {
                if (err) { return next(err); }
                // Successful - redirect to product detail page.
                res.redirect(product.url);
            });
        }
    }
];

// Check if there is no instances of this product in the inventory, if not delete it
exports.product_delete = function (req, res, next) {
    async.parallel({
        product: function (callback) {
            Product.findById(req.params.id).exec(callback)
        },
        inventory_products: function (callback) {
            Inventory.find({ 'product': req.params.id }).exec(callback)
        },
    }, function (err, results) {
        if (err) { return next(err); }
        if (results.inventory_products.length > 0) {
            // Inventory has this product. 
            res.render('product_delete', { title: 'Cannot Delete Product', product: results.product, inventory_products: results.inventory_products });
            return;
        }
        else {
            // This product is not in the inventory. Delete object and redirect to the list of product.
            Product.findByIdAndRemove(req.params.id, function deleteProduct(err) {
                if (err) { return next(err); }
                res.redirect('/products')
            })
        }
    });
};