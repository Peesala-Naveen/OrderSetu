const mongoose = require('mongoose');

const MenuSchema = new mongoose.Schema({
    restaurant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    cost: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        default: 'No description available'
    },
    image: {
        type: String
    },
    availability: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.models.Menu || mongoose.model('Menu', MenuSchema);
