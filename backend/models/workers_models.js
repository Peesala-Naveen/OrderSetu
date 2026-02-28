const { TokenExpiredError } = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // <-- Add this line

const WorkerSchema = new mongoose.Schema({
    restaurant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    mobileNumber: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    salary: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['chef', 'waiter', 'cleaner'], // Owner can add more types dynamically in the future
    },
    token: {
        type: String
    }
});

// Hash password before saving
WorkerSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    // Only hash if not already hashed (bcrypt hash is 60 chars)
    if (this.password && this.password.length === 60 && /^\$2[aby]\$/.test(this.password)) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

//compare password method for login
WorkerSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.models.Worker || mongoose.model('Worker', WorkerSchema);
