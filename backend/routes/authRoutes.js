

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getOwner,
    getWorker,
    signUp,
    login,
    editOwnerProfile,
    editMenu,
    addItemToMenu,
    getRestaurantOptions,
    getRestaurantRoles,
    getJoinRequests,
    editJoinRequest,
    getMenuItems,
    editWorkerProfile,
    addBillRequest,
    getBillRequest,
    getRestaurantDetails,
    getRestaurantDetailsById,
    editPaymentStatus,
    getAllWorkers,
    deleteWorker,
    getMenuByIdForCustomers,
    addConfirmedItems,
    deleteOrderFromConfirmedOrders,
    getConfirmedOrders,
    getChefItemSummary,
    markItemDelivered,
    getOrderSetuStats,
    updateConfirmedItem,
    acceptConfirmedOrder,
    deleteItemsFromMenu
} = require('../controllers/authControllers');


console.log("🔥🔥 authRoutes.js LOADED FROM:", __filename);


const { verifyPassword } = require('../controllers/authControllers');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() }); // Use memory storage for simplicity

router.post('/signup', signUp);
router.post('/login', login);
router.post('/verify-password', protect, verifyPassword);

// Route to delete order from ConfirmedOrder collection by confirmedOrderId
router.delete('/delete-confirmed-orders/:confirmedOrderId', protect, deleteOrderFromConfirmedOrders);

// Protected route for waiter to get total confirmed items
router.get('/get-confirmed-orders', protect, getConfirmedOrders);

// Protected route for waiter to mark item as delivered
router.post('/mark-item-delivered', protect, markItemDelivered);

// Protected route for chef to get item summary
router.get('/chef-item-summary', protect, getChefItemSummary);

// Separate routes for owner and worker profile fetch
router.get('/me/owner', protect, getOwner);
router.get('/me/worker', protect, getWorker);

// Route to add confirmed items
router.post('/add-confirmed-items', addConfirmedItems);

// Edit owner profile (PATCH, authenticated)
router.patch('/edit-owner-profile', protect, editOwnerProfile);


// Edit confirmed item (PATCH, authenticated)
router.patch('/update-confirmed-item', protect, updateConfirmedItem);
router.patch("/accept-confirmed-order", protect, acceptConfirmedOrder);

// Edit menu item (PATCH, authenticated, itemId param)
router.patch('/edit-menu/:itemId', protect, upload.single('image'), editMenu);
router.post('/add-menu-item', protect, upload.single('image'), addItemToMenu);
router.delete('/delete-item-from-menu/:itemId', protect, deleteItemsFromMenu);



// Get all restaurants (id and name for dropdown)
router.get('/restaurant-options', getRestaurantOptions);
router.get('/restaurant-roles/:restaurantId', getRestaurantRoles);

// Get all workers for the authenticated owner's restaurant
router.get('/join-requests', protect, getJoinRequests);

// PATCH: Edit join request status (Accept/Reject)
router.patch("/join-requests/:id/status", protect, editJoinRequest);

// GET: Get menu items for the authenticated user
router.get("/get-menu", protect, getMenuItems);

// Add route for editing worker profile
router.patch('/edit-worker-profile', protect, editWorkerProfile);

// Add route for adding a bill request
router.post('/add-bill-request', addBillRequest);

// Add protected route for getting bill requests
router.get('/get-bill-request', protect, getBillRequest);

// Add protected route for editing payment status
router.patch('/edit-payment-status/:billId', protect, editPaymentStatus);

// Add protected route for getting all workers for the authenticated owner's restaurant
router.get('/get-all-Workers', protect, getAllWorkers);

// Add protected route for deleting a worker by ID
router.delete('/delete-worker/:workerId', protect, deleteWorker);

// Add this route for customers (no auth required)
router.get('/get-menu/:restaurantId', getMenuByIdForCustomers);

// Add protected route for getting restaurant details by id
router.get('/restaurant-details/:restaurantId', getRestaurantDetailsById);

//get the details to home page stats
router.get("/ordersetu-stats", getOrderSetuStats);

module.exports = router;
