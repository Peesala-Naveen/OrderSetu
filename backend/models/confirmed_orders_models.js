const mongoose = require('mongoose');

const ConfirmedOrderSchema = new mongoose.Schema({
    restaurant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    table_number: {
        type: Number,
        required: true
    },

    isAccepted: {
        type: Boolean,
        default: false
    },
    acceptedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Worker",
        default: null
    },
    confirmed_items: [
        {
            item_name: { type: String, required: true },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true },
            total_price: { type: Number, required: true }
        }
    ]
}, { timestamps: true });

module.exports = mongoose.models.ConfirmedOrder || mongoose.model('ConfirmedOrder', ConfirmedOrderSchema);
