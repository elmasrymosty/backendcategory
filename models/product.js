const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, default: '' }, // main image
    images: [{ type: String }],           // gallery images
    video: { type: String, default: '' },  // 🌟 new field for product video
    brand: { type: String, default: '' },
    price: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    priceAfterDiscount: { type: Number, default: 0 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    countInStock: { type: Number, required: true, min: 0, max: 1000 },
    deliveryCharge: { type: Number },
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    dateCreated: { type: Date, default: Date.now },
});

productSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

productSchema.set('toJSON', { virtuals: true });

exports.Product = mongoose.model('Product', productSchema);
