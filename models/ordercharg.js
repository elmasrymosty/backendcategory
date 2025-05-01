const mongoose = require('mongoose');
const orderchargeSchema = mongoose.Schema({
    deliveryCharge: {
        type:Number,
        required: true,
    },
   
})

orderchargeSchema.virtual('id').get(function () {
    return this._id.toHexString();
});
orderchargeSchema.set('toJSON', {
    virtuals: true,
});
exports.Ordercharge = mongoose.model('Ordercharge', orderchargeSchema);