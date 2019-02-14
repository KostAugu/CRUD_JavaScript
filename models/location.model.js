const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let LocationSchema = new Schema({
  country: { type: String, required: true, maxlength: 100 },
  city: { type: String, required: true, maxlength: 100 },
  street: { type: String, required: true, maxlength: 100 },
  latitude: { type: Number },
  longitude: { type: Number },
});

LocationSchema
  .virtual('url')
  .get(function () {
    return '/locations/' + this._id;
  });

module.exports = mongoose.model('Location', LocationSchema);