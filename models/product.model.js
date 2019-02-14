const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let ProductSchema = new Schema({
  title: { type: String, required: true, maxlength: 100 },
  description: { type: String, required: true, maxlength: 200 },
  price: { type: Number, required: true, min: 0 },
});

ProductSchema
  .virtual('url')
  .get(function () {
    return '/products/' + this._id;
  });

module.exports = mongoose.model('Product', ProductSchema);