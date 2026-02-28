const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const RestaurantSchema = new mongoose.Schema({
    restaurantId: {
        type: String,
        unique: true,
        required: [true, 'Restaurant ID is required']
    },
    restaurantName: {
        type: String,
        required: [true, 'Restaurant name is required']
    },
    ownerName: {
        type: String,
        required: [true, 'Owner name is required']
    },
    type: {
        type: String,
        default: 'owner'
    },
    mobileNumber: {
        type: String,
        required: [true, 'Mobile number is required']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true
    },
    address: {
        type: String
    },
    password: {
        type: String,
        required: [true, 'Password is required']
    },
    roles: {
        type: [String],
        default: ['chef', 'waiter', 'cleaner']
    },
    table: {
        type: Number,
        default: 1
    },
    serviceCharges: {
        type: Number,
        default: 0
    },
    gst: {
        type: Number,
        default: 0
    },
    token: {
        type: String
    },
    acceptedOrdersCount: {
        type: Number,
        default: 0
    }
});

// Hash password before saving
RestaurantSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (err) {
        throw new Error('Error hashing password');
    }
});

//compare password method for login
RestaurantSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Restaurant', RestaurantSchema);