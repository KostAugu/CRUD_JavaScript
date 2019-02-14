const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let InventorySchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  stock: { type: Number, required: true, min: 0 },
  location: { type: Schema.Types.ObjectId, ref: 'Location', required: true }
});

InventorySchema
  .virtual('url')
  .get(function () {
    return '/inventory/' + this._id;
  });

module.exports = mongoose.model('Inventory', InventorySchema);