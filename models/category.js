const mongoose = require('mongoose');

const categorySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    image: {
      url: { type: String, required: true },
      public_id: { type: String, required: true },
      resource_type: {
        type: String,
        enum: ['image', 'video'],
        default: 'image',
      },
    },
  },
  { timestamps: true }
);

categorySchema.virtual('id').get(function () {
  return this._id.toHexString();
});

categorySchema.set('toJSON', {
  virtuals: true,
});

exports.Category = mongoose.model('Category', categorySchema);
