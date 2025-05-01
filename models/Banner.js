const mongoose = require('mongoose');

const bannerSchema = mongoose.Schema({
  images: [
    {
      url: { type: String, required: true },
      public_id: { type: String, required: true }
      ,
      resource_type: { type: String, enum: ['image', 'video'], default: 'image' },
    }
  ]
}, { timestamps: true });

bannerSchema.virtual('idString').get(function () {
  return this._id.toHexString();
});

bannerSchema.set('toJSON', {
  virtuals: true,
});

exports.Banner = mongoose.model('Banner', bannerSchema);
