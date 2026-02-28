const mongoose = require('mongoose');

const BillingSchema = new mongoose.Schema({
    restaurant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    confirmedOrderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ConfirmedOrder",
        required: true
    },
    requestId: {
        type: String,
        unique: true,
        required: true,
    },

    items: {
        type: [mongoose.Schema.Types.Mixed], // <-- FIXED: array of objects
        required: true
    },
    subtotal: {
        type: Number,
        required: true
    },
    serviceCharges: {
        type: Number,
        required: true
    },
    gst: {
        type: Number,
        required: true
    },
    grandTotal: {
        type: Number,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['Accepted', 'Rejected', 'Pending'],
        default: 'Pending'
    }
}, { timestamps: true });

module.exports = mongoose.model('Billing', BillingSchema);
