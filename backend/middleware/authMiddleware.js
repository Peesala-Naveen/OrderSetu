const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const RestaurantSchema = require("../models/restaurants_models.js");
const WorkerSchema = require("../models/workers_models.js");
dotenv.config();

const protect = async (req, res, next) => {
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
        return res.status(401).json({ message: "Not authorized, no token" });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.type && decoded.type !== "owner") {
            // Worker (chef, waiter, chef, etc.)
            req.user = await WorkerSchema.findById(decoded.id).select("-password");
        } else {
            // Owner
            req.user = await RestaurantSchema.findById(decoded.id).select("-password");
        }
        if (!req.user) {
            return res.status(401).json({ message: "Not authorized, user not found" });
        }
        next();
    } catch (error) {
        return res.status(401).json({ message: "Not authorized, token failed" });
    }
};

module.exports = { protect };