

const RestaurantSchema = require("../models/restaurants_models.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const MenuSchema = require("../models/menu_models.js");
const WorkerSchema = require("../models/workers_models.js");
const RequestSchema = require("../models/request_models.js");
const dotenv = require("dotenv");
const BillingSchema = require('../models/billing_models.js');
const ConfirmedOrderSchema = require('../models/confirmed_orders_models.js');

dotenv.config();
const mongoose = require("mongoose");

// Add confirmed items to ConfirmedOrder collection
const addConfirmedItems = async (req, res) => {
    try {
        const { restaurant_id, table_number, confirmed_items } = req.body;

        // restaurant_id must come from frontend (customer)
        if (
            !restaurant_id ||
            !mongoose.Types.ObjectId.isValid(restaurant_id) ||
            !table_number ||
            !Array.isArray(confirmed_items)
        ) {
            return res.status(400).json({ message: "Invalid data" });
        }

        const confirmedOrder = await ConfirmedOrderSchema.create({
            restaurant_id,
            table_number,
            confirmed_items
        });

        res.status(201).json({
            message: "Confirmed items added",
            confirmedOrder
        });
    } catch (error) {
        console.error("addConfirmedItems error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const createToken = (restaurantId) => {
    return jwt.sign({ id: restaurantId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
}

const signUp = async (req, res) => {
    try {
        const { type, restaurantId, restaurantName, ownerName, mobileNumber, email, address, password } = req.body;
        if (!type || !mobileNumber || !email || !password) {
            return res.status(400).json({ message: "Type, mobile number, email, and password are required" });
        }
        if (type === 'owner') {
            if (!restaurantId || !restaurantName || !ownerName) {
                return res.status(400).json({ message: "Restaurant ID, name, and owner name are required for owner" });
            }
            const existingRestaurant = await RestaurantSchema.findOne({ $or: [{ restaurantId }, { email }] });
            if (existingRestaurant) {
                return res.status(400).json({ message: "Restaurant with given ID or email already exists" });
            }
            //create new restaurant (owner)
            const restaurant = await RestaurantSchema.create({
                restaurantId,
                restaurantName,
                ownerName,
                mobileNumber,
                email,
                address,
                password
            });
            // Generate JWT token and store it in the restaurant document
            const token = createToken(restaurant._id);
            restaurant.token = token;
            await restaurant.save();
            return res.status(201).json({ message: "Owner registered successfully", token });
        } else {
            // Worker signup request (not owner)
            if (!restaurantId) {
                return res.status(400).json({ message: "Restaurant ID is required for workers" });
            }
            const restaurant = await RestaurantSchema.findOne({ restaurantId });
            if (!restaurant) {
                return res.status(404).json({ message: "Restaurant not found for given restaurantId" });
            }
            // Check if request with same email exists and is pending
            const existingRequest = await RequestSchema.findOne({ email, status: 'pending' });
            if (existingRequest) {
                return res.status(400).json({ message: "A pending request with this email already exists" });
            }
            // Hash the password before storing in RequestSchema
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            // Store request with status 'pending', salary default 0
            const request = await RequestSchema.create({
                restaurant_id: restaurant._id,
                name: req.body.name,
                mobileNumber,
                email,
                password: hashedPassword, // store hashed password
                type,
                status: 'pending'
            });
            return res.status(201).json({ message: "Signup request submitted and pending approval", request });
        }
    } catch (error) {
        console.error(`SignUp not Sucessfull: ${error.message}`);
        res.status(500).json({ message: "Server Error" });
    }
}
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and Password fields are required" });
        }
        // First, try to find in RestaurantSchema (owner)
        let user = await RestaurantSchema.findOne({ email });
        let userType;
        if (user) {
            userType = 'owner';
        } else {
            // If not found, try to find in WorkerSchema
            user = await WorkerSchema.findOne({ email });
            if (user) {
                userType = user.type; // Use actual type: 'chef', 'waiter', etc.
            }
        }
        if (!user) {
            return res.status(400).json({ message: "You are not a User. Please SignUp." });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid Credentials" });
        }
        // Generate JWT token and store it in the user document (for both owner and worker)
        let token;
        if (userType === 'owner') {
            token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
            user.token = token;
            await user.save();
        } else {
            token = jwt.sign({ id: user._id, type: userType, restaurant_id: user.restaurant_id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
            user.token = token;
            await user.save();
        }
        // Send token to frontend, frontend should store it in localStorage
        return res.status(200).json({ message: "Login Successful", token, userType, userId: user._id });
    } catch (error) {
        console.error(`Login not Sucessfull: ${error.message}`);
        res.status(500).json({ message: "Server Error" });
    }
}

const addItemToMenu = async (req, res) => {
    try {
        // Only owner and chef can add items
        const userType = req.user.type || 'owner';
        if (userType !== 'owner' && userType !== 'chef') {
            return res.status(403).json({ message: "Only owners and chefs can add items to the menu" });
        }

        // For multipart/form-data, fields are in req.body, file is in req.file
        const { name, cost, description } = req.body;
        let image = null;
        if (req.file) {
            // You can save the image to disk, cloud, or encode as base64
            // For now, just store the buffer as base64 string (for demo)
            image = req.file.buffer.toString('base64');
        }

        if (!name || !cost) {
            return res.status(400).json({ message: "Name and Cost fields are required" });
        }

        const ownerRestaurantId = req.user.restaurant_id ? req.user.restaurant_id.toString() : req.user._id.toString();

        const newItem = await MenuSchema.create({
            restaurant_id: ownerRestaurantId,
            name,
            cost,
            description: description || 'No description available',
            image
        });
        return res.status(201).json({ message: "Item added to menu successfully", item: newItem });
    } catch (error) {
        console.error(`Add Item to Menu not Sucessfull: ${error.message}`);
        res.status(500).json({ message: "Server Error" });
    }
}
const editOwnerProfile = async (req, res) => {
    try {
        // User is authenticated via middleware, user info is in req.user
        const userId = req.user._id;
        // Only allow updating certain fields
        const allowedFields = [
            "restaurantName",
            "ownerName",
            "mobileNumber",
            "email",
            "address",
            "table",
            "gst",
            "serviceCharges"
        ];
        const updates = {};
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        // If password update is requested, hash it
        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            updates.password = await bcrypt.hash(req.body.password, salt);
        }

        // Only error if no allowed fields AND no password
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: "No valid fields provided for update" });
        }

        const updatedRestaurant = await RestaurantSchema.findByIdAndUpdate(
            userId,
            { $set: updates },
            { new: true, runValidators: true, context: 'query' }
        ).select("-password");
        if (!updatedRestaurant) {
            return res.status(404).json({ message: "Restaurant not found" });
        }
        res.status(200).json({ message: "Profile updated successfully", user: updatedRestaurant });
    } catch (error) {
        console.error(`Edit Profile not Sucessfull: ${error.message}`);
        res.status(500).json({ message: "Server Error" });
    }
}

const editWorkerProfile = async (req, res) => {
    try {
        let userId;
        // If owner, allow editing any worker by _id in body
        if (req.user && req.user.ownerName) {
            userId = req.body._id;
            if (!userId) {
                return res.status(400).json({ message: "Worker ID (_id) is required." });
            }
        } else {
            // Worker can only edit their own profile
            userId = req.user._id;
        }
        // Only allow updating certain fields
        const allowedFields = [
            "name",
            "mobileNumber",
            "email",
            "salary"
        ];
        const updates = {};
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });
        if (Object.keys(updates).length === 0 && !req.body.password) {
            return res.status(400).json({ message: "No valid fields provided for update" });
        }
        // If password update is requested, hash it
        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            updates.password = await bcrypt.hash(req.body.password, salt);
        }
        const updatedWorker = await WorkerSchema.findByIdAndUpdate(
            userId,
            { $set: updates },
            { new: true, runValidators: true, context: 'query' }
        ).select("-password");
        if (!updatedWorker) {
            return res.status(404).json({ message: "Worker not found" });
        }

        /* 🔔 SALARY UPDATE NOTIFICATION */
        if (updates.salary !== undefined) {
            const socketApi = req.app.get("socketApi");

            if (socketApi) {
                socketApi.notifySalaryUpdated(
                    updatedWorker._id.toString(),
                    updates.salary
                );
            }
        }
        res.status(200).json({ message: "Profile updated successfully", user: updatedWorker });
    } catch (error) {
        console.error(`Edit Worker Profile not Sucessfull: ${error.message}`);
        res.status(500).json({ message: "Server Error" });
    }
}

const editMenu = async (req, res) => {
    try {
        // Only owner and chef can edit menu items
        const userType = req.user.type || 'owner'; // default to owner if not present
        if (userType !== 'owner' && userType !== 'chef') {
            return res.status(403).json({ message: "Only owners and chefs can edit menu items" });
        }
        const userId = req.user.restaurant_id ? req.user.restaurant_id : req.user._id;
        const { itemId } = req.params;

        // For multipart/form-data, fields are in req.body, file is in req.file
        const allowedFields = ["name", "cost", "description", "availability"];
        const updates = {};
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                // For boolean fields (like availability), handle string conversion
                if (field === "availability") {
                    // Accept true/false, "true"/"false", 1/0
                    const val = req.body[field];
                    if (typeof val === "boolean") {
                        updates[field] = val;
                    } else if (typeof val === "string") {
                        updates[field] = val === "true" || val === "1";
                    } else if (typeof val === "number") {
                        updates[field] = !!val;
                    }
                } else {
                    updates[field] = req.body[field];
                }
            }
        });
        // Handle image update: if file is present, update; else, retain existing image
        if (req.file) {
            updates.image = req.file.buffer.toString('base64');
        } else if (req.body.image !== undefined && req.body.image !== "" && req.body.image !== null) {
            // If image is sent as a string (e.g., from JSON), update it
            updates.image = req.body.image;
        }
        // If neither file nor image in body, do not touch the image field (retain existing)

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: "No valid fields provided for update" });
        }

        // Find the menu item and ensure it belongs to the user's restaurant
        const menuItem = await MenuSchema.findOne({ _id: itemId, restaurant_id: userId });
        if (!menuItem) {
            return res.status(404).json({ message: "Menu item not found or not authorized" });
        }
        // Update the menu item
        Object.assign(menuItem, updates);
        await menuItem.save();
        res.status(200).json({ message: "Menu item updated successfully", item: menuItem });
    } catch (error) {
        console.error(`Edit Menu not Sucessfull: ${error.message}`);
        res.status(500).json({ message: "Server Error" });
    }
};


const deleteItemsFromMenu = async (req, res) => {
    try {
        const userType = req.user.type || 'owner';

        if (userType !== 'owner' && userType !== 'chef') {
            return res.status(403).json({
                message: 'Unauthorized: Only owner or chef can delete menu items'
            });
        }

        const restaurantId = req.user.restaurant_id || req.user._id;
        const { itemId } = req.params;

        const menuItem = await MenuSchema.findOne({
            _id: itemId,
            restaurant_id: restaurantId
        });

        if (!menuItem) {
            return res.status(404).json({
                message: 'Menu item not found or unauthorized'
            });
        }

        await MenuSchema.deleteOne({ _id: itemId });

        res.status(200).json({ message: 'Menu item deleted successfully' });
    } catch (error) {
        console.error('Delete Menu Item error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
// Approve worker request: owner sets status to 'approved' and salary, then add to WorkerSchema
const approveWorkerRequest = async (req, res) => {
    try {
        const { requestId, salary } = req.body;
        // Find the request
        const request = await RequestSchema.findOne({ _id: requestId, status: 'pending' });
        if (!request) {
            return res.status(404).json({ message: "Pending request not found" });
        }
        // Update status and salary
        request.status = 'approved';
        if (salary !== undefined) {
            request.salary = salary;
        }
        await request.save();
        // Add to WorkerSchema
        const existingWorker = await WorkerSchema.findOne({ email: request.email });
        if (existingWorker) {
            return res.status(400).json({ message: "Worker with this email already exists" });
        }
        // DO NOT hash the password here, use as is from request (already hashed)
        const worker = await WorkerSchema.create({
            restaurant_id: request.restaurant_id,
            name: request.name,
            mobileNumber: request.mobileNumber,
            email: request.email,
            password: request.password, // already hashed
            salary: request.salary,
            type: request.type
        });
        // Remove request from RequestSchema
        await RequestSchema.deleteOne({ _id: requestId });
        const token = jwt.sign({ id: worker._id, type: worker.type, restaurant_id: worker.restaurant_id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
        worker.token = token;
        await worker.save();
        return res.status(200).json({ message: "Worker approved and added", worker });
    } catch (error) {
        console.error(`Approve Worker Request not successful: ${error.message}`);
        res.status(500).json({ message: "Server Error" });
    }
};
// Get all restaurants (id and name for dropdown)
const getRestaurantOptions = async (req, res) => {
    try {
        const restaurants = await RestaurantSchema.find(
            {},
            "restaurantId restaurantName"
        );

        const options = restaurants.map(r => ({
            _id: r._id.toString(),
            restaurantId: r.restaurantId,
            label: `${r.restaurantId} - ${r.restaurantName}` //  DISPLAY
        }));

        res.status(200).json(options);
    } catch (error) {
        console.error("Error fetching restaurant options:", error.message);
        res.status(500).json({ message: "Server Error" });
    }
};
// Get roles for a restaurant by restaurantId
const getRestaurantRoles = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const restaurant = await RestaurantSchema.findOne({ restaurantId });
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }
        res.status(200).json({ roles: restaurant.roles });
    } catch (error) {
        console.error('Error fetching restaurant roles:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
}
// Get all join requests (pending workers) for the authenticated owner's restaurant
const getJoinRequests = async (req, res) => {
    try {
        // Owner authentication assumed via middleware, user info in req.user
        const ownerId = req.user._id;
        // Find the owner's restaurant
        const restaurant = await RestaurantSchema.findById(ownerId);
        if (!restaurant) {
            return res.status(404).json({ message: "Owner's restaurant not found" });
        }
        // Find all pending requests with matching restaurant_id
        const requests = await RequestSchema.find({ restaurant_id: restaurant._id, status: 'pending' });
        res.status(200).json({ requests });
    } catch (error) {
        console.error('Error fetching join requests:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
}
// PATCH: Edit join request status (Accept/Reject)
const editJoinRequest = async (req, res) => {
    try {
        const { id } = req.params;
        let { status, salary } = req.body;
        // Map frontend status to schema status
        if (status === "Accepted") status = "approved";
        if (status === "Rejected") status = "rejected";
        if (!["approved", "rejected"].includes(status)) {
            return res.status(400).json({ message: "Status must be 'approved' or 'rejected'" });
        }
        const request = await RequestSchema.findById(id);
        if (!request) {
            return res.status(404).json({ message: "Join request not found" });
        }
        if (status === "approved") {
            request.status = "approved";
            if (salary !== undefined) {
                request.salary = salary;
            }
            await request.save();
            // Check if worker already exists
            const existingWorker = await WorkerSchema.findOne({ email: request.email });
            if (existingWorker) {
                await RequestSchema.deleteOne({ _id: id });
                return res.status(400).json({ message: "Worker with this email already exists, request removed" });
            }
            // Create worker with already hashed password from request
            const worker = await WorkerSchema.create({
                restaurant_id: request.restaurant_id,
                name: request.name,
                mobileNumber: request.mobileNumber,
                email: request.email,
                password: request.password, // already hashed
                salary: request.salary,
                type: request.type
            });
            await RequestSchema.deleteOne({ _id: id });
            const token = jwt.sign({ id: worker._id, type: worker.type, restaurant_id: worker.restaurant_id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
            worker.token = token;
            await worker.save();
            return res.status(200).json({ message: "Worker approved and added", worker });
        } else if (status === "rejected") {
            await RequestSchema.deleteOne({ _id: id });
            return res.status(200).json({ message: "Join request rejected and removed" });
        }
    } catch (error) {
        console.error('editJoinRequest error:', error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};
const getMenuItems = async (req, res) => {
    try {
        // Restaurant id from authenticated user
        const restaurantId = req.user.restaurant_id ? req.user.restaurant_id : req.user._id;
        const items = await MenuSchema.find({ restaurant_id: restaurantId });
        res.status(200).json({ items });
    } catch (error) {
        console.error('Error fetching menu items:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
};
const getOwner = async (req, res) => {
    try {
        // req.user is set by the protect middleware
        let user = null;
        if (req.user.type && req.user.type !== 'owner') {
            // Worker
            user = await WorkerSchema.findById(req.user._id).select('-password');
        } else {
            // Owner
            user = await RestaurantSchema.findById(req.user._id).select('-password');
        }
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};
const verifyPassword = async (req, res) => {
    try {
        const { currentPassword } = req.body;
        let user;
        if (req.user.type && req.user.type !== 'owner') {
            user = await WorkerSchema.findById(req.user._id);
        } else {
            user = await RestaurantSchema.findById(req.user._id);
        }
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (isMatch) {
            return res.status(200).json({ success: true });
        } else {
            return res.status(401).json({ success: false, message: "Current password is incorrect." });
        }
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};
const addBillRequest = async (req, res) => {
    try {
        const {
            restaurant_id,
            confirmedOrderId,
            requestId,
            items,
            subtotal,
            serviceCharges,
            gst,
            grandTotal,
            paymentStatus
        } = req.body;

        // Validate required fields
        if (
            !restaurant_id ||
            !requestId ||
            !items ||
            !items.length ||
            subtotal == null ||
            serviceCharges == null ||
            gst == null ||
            grandTotal == null
        ) {
            return res.status(400).json({
                message: "Missing required billing fields"
            });
        }

        const bill = await BillingSchema.create({
            restaurant_id,
            confirmedOrderId,
            requestId,
            items,
            subtotal,
            serviceCharges,
            gst,
            grandTotal,
            paymentStatus: paymentStatus || "Pending"
        });

        res.status(201).json({
            message: "Bill created successfully",
            bill
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};
const getWorker = async (req, res) => {
    try {
        const user = await WorkerSchema.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ message: "Worker not found" });
        }
        res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};
// Get all bills for the authenticated user's restaurant
const getBillRequest = async (req, res) => {
    try {
        let restaurantId = null;
        if (req.user.type && req.user.type !== 'owner') {
            restaurantId = req.user.restaurant_id;
        } else {
            restaurantId = req.user._id;
        }
        if (!restaurantId) {
            return res.status(400).json({ message: "Restaurant ID not found for user" });
        }
        // Use the correct field name: restaurant_id
        const bills = await BillingSchema.find({ restaurant_id: restaurantId });
        res.status(200).json({ bills });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};
// Edit payment status of a bill (Accept/Reject)
const editPaymentStatus = async (req, res) => {
    try {
        const { billId } = req.params;
        let { paymentStatus } = req.body;
        // Normalize status input
        if (paymentStatus === "Accept") paymentStatus = "Accepted";
        if (paymentStatus === "Reject") paymentStatus = "Rejected";
        if (!["Accepted", "Rejected"].includes(paymentStatus)) {
            return res.status(400).json({ message: "Status must be 'Accepted' or 'Rejected'" });
        }
        const bill = await BillingSchema.findById(billId);
        if (!bill) {
            return res.status(404).json({ message: "Bill not found" });
        }
        bill.paymentStatus = paymentStatus;
        await bill.save();
        // 🔔 SEND WEBSOCKET NOTIFICATION
        if (paymentStatus === "Accepted") {
            // Increment acceptedOrdersCount in RestaurantSchema
            await RestaurantSchema.findByIdAndUpdate(
                bill.restaurant_id,
                { $inc: { acceptedOrdersCount: 1 } }
            );

            // 🔔 WebSocket notification
            if (bill.confirmedOrderId) {
                const socketApi = req.app.get("socketApi");
                socketApi.notifyPaymentAccepted(bill.confirmedOrderId.toString());
            }
        }
        if (paymentStatus === "Rejected") {
            if (bill.confirmedOrderId) {
                const socketApi = req.app.get("socketApi");
                socketApi.notifyPaymentRejected(bill.confirmedOrderId.toString());
            }
        }

        // Remove the bill from the collection if status is not Pending
        if (paymentStatus !== "Pending") {
            await BillingSchema.deleteOne({ _id: billId });
        }

        res.status(200).json({ message: `Payment status updated to ${paymentStatus}`, bill });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

const getAllWorkers = async (req, res) => {
    try {
        // Owner authentication assumed via middleware, user info in req.user
        const ownerId = req.user._id;
        // Find the owner's restaurant
        const restaurant = await RestaurantSchema.findById(ownerId);
        if (!restaurant) {
            return res.status(404).json({ message: "Owner's restaurant not found" });
        }
        // Find all workers with matching restaurant_id
        const workers = await WorkerSchema.find({ restaurant_id: restaurant._id }).select('-password');
        res.status(200).json({ workers });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

// Delete worker by ID
const deleteWorker = async (req, res) => {
    try {
        const { workerId } = req.params;
        const deleted = await WorkerSchema.findByIdAndDelete(workerId);
        if (!deleted) {
            return res.status(404).json({ message: "Worker not found" });
        }
        res.status(200).json({ message: "Worker deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};



const getMenuByIdForCustomers = async (req, res) => {
    try {
        const { restaurantId } = req.params;

        // ✅ Validate Mongo ObjectId
        if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
            return res.status(400).json({ message: "Invalid restaurant id" });
        }

        // ✅ Use Mongo _id directly
        const items = await MenuSchema.find({ restaurant_id: restaurantId }).lean();

        const itemsWithPrice = items.map(item => ({
            ...item,
            price: item.cost
        }));

        res.status(200).json({ items: itemsWithPrice });
    } catch (error) {
        console.error("Error fetching menu items for customer:", error.message);
        res.status(500).json({ message: "Server Error" });
    }
};



const getRestaurantDetailsById = async (req, res) => {
    try {
        const { restaurantId } = req.params;

        // ✅ Validate Mongo ObjectId
        if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
            return res.status(400).json({ message: "Invalid restaurant id" });
        }

        // ✅ Find by Mongo _id
        const restaurant = await RestaurantSchema.findById(restaurantId);

        if (!restaurant) {
            return res.status(404).json({ message: "Restaurant not found" });
        }

        res.status(200).json({
            restaurantId: restaurant.restaurantId, // REST@003 (display)
            restaurantName: restaurant.restaurantName,
            noOfTables: restaurant.noOfTables || restaurant.table || restaurant.tables || 0,
            serviceCharges: Number(restaurant.serviceCharges || 0),
            gst: Number(restaurant.gst || 0),
        });
    } catch (error) {
        console.error("Error fetching restaurant details:", error.message);
        res.status(500).json({ message: "Server Error" });
    }
};



// Delete order from ConfirmedOrder collection by confirmedOrderId

const deleteOrderFromConfirmedOrders = async (req, res) => {
    try {
        const { confirmedOrderId } = req.params;

        if (!confirmedOrderId) {
            return res.status(400).json({ message: "ConfirmedOrderId is required" });
        }

        const deletedOrder = await ConfirmedOrderSchema.findByIdAndDelete(confirmedOrderId);

        if (!deletedOrder) {
            return res.status(404).json({ message: "Confirmed order not found" });
        }

        res.status(200).json({
            message: "Confirmed order deleted successfully",
            deletedOrder
        });

    } catch (error) {
        console.error("Delete confirmed order error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
// Get total confirmed orders (for waiter/chef)
const getConfirmedOrders = async (req, res) => {
    try {
        const restaurant_id = req.user.restaurant_id;
        const waiterId = req.user._id;

        if (!restaurant_id) {
            return res.status(400).json({
                message: 'Restaurant ID not found for this user'
            });
        }

        const orders = await ConfirmedOrderSchema.find({
            restaurant_id,
            $or: [
                { isAccepted: false },
                { acceptedBy: waiterId }
            ]
        });

        const tableMap = {};

        orders.forEach(order => {
            const tableNum = order.table_number;

            if (!tableMap[tableNum]) {
                tableMap[tableNum] = {
                    table: tableNum,
                    restaurant_id,
                    confirmedOrderId: order._id,
                    isAccepted: order.isAccepted,
                    acceptedBy: order.acceptedBy,
                    items: []
                };
            }

            order.confirmed_items.forEach(item => {
                const existingItem = tableMap[tableNum].items.find(
                    i => i.name === item.item_name
                );

                if (existingItem) {
                    existingItem.quantity += item.quantity;
                } else {
                    tableMap[tableNum].items.push({
                        name: item.item_name,
                        quantity: item.quantity
                    });
                }
            });
        });

        res.status(200).json({
            requests: Object.values(tableMap)
        });

    } catch (error) {
        console.error("getConfirmedOrders error:", error);
        res.status(500).json({
            message: 'Error fetching confirmed orders'
        });
    }
};



// Get summary of items ordered (for chef dashboard)
const getChefItemSummary = async (req, res) => {
    try {
        if (req.user.type !== "chef") {
            return res.status(403).json({ message: "Access denied" });
        }

        const restaurant_id = req.user.restaurant_id;

        if (!restaurant_id) {
            return res.status(400).json({
                message: "Restaurant ID not found for this user"
            });
        }

        const result = await ConfirmedOrderSchema.aggregate([
            { $match: { restaurant_id: new mongoose.Types.ObjectId(restaurant_id), isAccepted: true } },
            { $unwind: "$confirmed_items" },
            {
                $group: {
                    _id: "$confirmed_items.item_name",
                    totalQuantity: { $sum: "$confirmed_items.quantity" }
                }
            },
            {
                $project: {
                    _id: 0,
                    item: "$_id",
                    quantity: "$totalQuantity"
                }
            },
            { $sort: { quantity: -1 } }
        ]);

        res.status(200).json({ items: result });

    } catch (error) {
        console.error("getChefItemSummary error:", error);
        res.status(500).json({ message: "Server error" });
    }
};


// Waiter marks item as delivered
const markItemDelivered = async (req, res) => {
    try {
        const { restaurantId, table, itemName, quantity } = req.body;

        if (!restaurantId || !table || !itemName || !quantity) {
            return res.status(400).json({ message: "Missing fields" });
        }

        const order = await ConfirmedOrderSchema.findOne({
            restaurant_id: restaurantId,
            table_number: table
        });

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        order.confirmed_items = order.confirmed_items
            .map(item => {
                if (item.item_name === itemName) {
                    item.quantity -= quantity;
                }
                return item;
            })
            .filter(item => item.quantity > 0);

        await order.save();

        const socketApi = req.app.get("socketApi");
        socketApi.notifyItemDelivered(
            restaurantId.toString(),
            itemName,
            quantity
        );

        res.status(200).json({ message: "Item marked as delivered" });
    } catch (error) {
        console.error("markItemDelivered error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const getOrderSetuStats = async (req, res) => {
    try {
        // 1. Total restaurants (owners)
        const restaurantCount = await RestaurantSchema.countDocuments();

        // 2. Total workers
        const workerCount = await WorkerSchema.countDocuments();
        // 3. Total menu items
        const menuCount = await MenuSchema.countDocuments();
        // 3. Total accepted orders (sum of Accept clicks)
        const acceptedAgg = await RestaurantSchema.aggregate([
            {
                $group: {
                    _id: null,
                    totalAcceptedOrders: {
                        $sum: "$acceptedOrdersCount"
                    }
                }
            }
        ]);

        const totalOrders = acceptedAgg[0]?.totalAcceptedOrders || 0;

        return res.status(200).json({
            restaurants: restaurantCount,
            users: restaurantCount + workerCount,
            orders: totalOrders,
            items: menuCount
        });
    } catch (error) {
        console.error("OrderSetu stats error:", error);
        return res.status(500).json({
            message: "Failed to fetch OrderSetu stats"
        });
    }
};

// Update quantity of an item in a confirmed order (for waiter)
const updateConfirmedItem = async (req, res) => {
    try {
        const { confirmedOrderId, itemName, quantity } = req.body;

        const order = await ConfirmedOrderSchema.findById(confirmedOrderId);
        if (!order) {
            return res.status(404).json({ message: "Confirmed order not found" });
        }

        let updates = [];
        const item = order.confirmed_items.find(i => i.item_name === itemName);

        if (!item) {
            return res.status(404).json({ message: "Item not found in order" });
        }

        const oldQty = item.quantity;

        if (quantity === 0) {
            // REMOVE ITEM
            order.confirmed_items = order.confirmed_items.filter(
                i => i.item_name !== itemName
            );

            updates.push({
                itemName,
                oldQty,
                newQty: 0,
                action: "removed"
            });
        } else {
            item.quantity = quantity;

            updates.push({
                itemName,
                oldQty,
                newQty: quantity,
                action: "updated"
            });
        }

        await order.save();

        // 🔔 Notify customer with DETAILS
        const socketApi = req.app.get("socketApi");
        socketApi.notifyOrderUpdated(order._id.toString(), updates);

        res.json({ success: true, updates });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Update failed" });
    }
};

const acceptConfirmedOrder = async (req, res) => {
    try {
        const { confirmedOrderId } = req.body;

        if (!confirmedOrderId) {
            return res.status(400).json({ message: "confirmedOrderId required" });
        }

        const order = await ConfirmedOrderSchema.findById(confirmedOrderId);

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Prevent double-accept
        if (order.isAccepted) {
            return res.status(400).json({ message: "Order already accepted" });
        }

        order.isAccepted = true;
        order.acceptedBy = req.user._id;
        await order.save();
        // 🔔 Notify Chef: New order accepted
        const socketApi = req.app.get("socketApi");

        if (socketApi) {
            socketApi.notifyNewOrderAccepted(
                order.restaurant_id.toString(),
                order.confirmed_items
            );
        }

        res.status(200).json({
            success: true,
            message: "Order accepted"
        });
    } catch (error) {
        console.error("acceptConfirmedOrder error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
module.exports = {
    signUp,
    login,
    addItemToMenu,
    editOwnerProfile,
    editWorkerProfile,
    editMenu,
    approveWorkerRequest,
    getRestaurantOptions,
    getRestaurantRoles,
    getJoinRequests,
    editJoinRequest,
    getMenuItems,
    getOwner,
    getWorker,
    verifyPassword,
    addBillRequest,
    getBillRequest,
    editPaymentStatus,
    getAllWorkers,
    deleteWorker,
    getMenuByIdForCustomers,
    getRestaurantDetailsById,
    addConfirmedItems,
    deleteOrderFromConfirmedOrders,
    getConfirmedOrders,
    getChefItemSummary,
    markItemDelivered,
    getOrderSetuStats,
    updateConfirmedItem,
    acceptConfirmedOrder,
    deleteItemsFromMenu
};