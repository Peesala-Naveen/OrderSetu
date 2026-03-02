const WebSocket = require("ws");

// confirmedOrderId → customer socket
const orderSocketMap = new Map();

// restaurantId (string) → chef socket
const chefSocketMap = new Map();

// workerId → worker socket (salary)
const workerSocketMap = new Map();

function setupWebSocket(server) {
    const wss = new WebSocket.Server({ server });

    wss.on("connection", (ws) => {

        ws.on("message", (message) => {
            try {
                const data = JSON.parse(message);

                // ================= CUSTOMER =================
                if (data.type === "JOIN_CUSTOMER") {
                    const { confirmedOrderId } = data;
                    if (confirmedOrderId) {
                        orderSocketMap.set(String(confirmedOrderId), ws);
                    }
                }

                // ================= CHEF =================
                if (data.type === "JOIN_CHEF") {
                    const { restaurantId } = data;
                    if (restaurantId) {
                        chefSocketMap.set(String(restaurantId), ws);

                    }
                }

                // ================= WORKER =================
                if (data.type === "JOIN_WORKER") {
                    const { workerId } = data;
                    if (workerId) {
                        workerSocketMap.set(String(workerId), ws);
                    }
                }

            } catch (err) {
                console.error("WebSocket message error:", err);
            }
        });

        ws.on("close", () => {
            // Cleanup customer sockets
            for (const [orderId, socket] of orderSocketMap.entries()) {
                if (socket === ws) {
                    orderSocketMap.delete(orderId);
                }
            }

            // Cleanup chef sockets
            for (const [restId, socket] of chefSocketMap.entries()) {
                if (socket === ws) {
                    chefSocketMap.delete(restId);
                }
            }

            // Cleanup worker sockets
            for (const [workerId, socket] of workerSocketMap.entries()) {
                if (socket === ws) {
                    workerSocketMap.delete(workerId);
                }
            }
        });
    });

    return {
        // ================= Owner sends to CUSTOMER =================
        notifyPaymentAccepted: (confirmedOrderId) => {
            const socket = orderSocketMap.get(String(confirmedOrderId));
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                    type: "PAYMENT_ACCEPTED",
                    message: "Payment Accepted Successfully"
                }));
            }
        },
        // =================Waiter sends to CUSTOMER =================
        notifyOrderUpdated: (confirmedOrderId, updates) => {
            const socket = orderSocketMap.get(String(confirmedOrderId));
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                    type: "ORDER_UPDATED",
                    updates
                }));
            }
        },
        // =================Owner sends to CUSTOMER =================
        notifyPaymentRejected: (confirmedOrderId) => {
            const socket = orderSocketMap.get(String(confirmedOrderId));
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                    type: "PAYMENT_REJECTED",
                    message: "Payment Rejected"
                }));
            }
        },

        // ================= Waiter sends to chef  =================
        notifyNewOrderAccepted: (restaurantId, items) => {
            const socket = chefSocketMap.get(String(restaurantId));
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                    type: "ORDER_ACCEPTED",
                    items
                }));
            }
        },

        // ================= Waiter sends to chef =================
        notifyItemDelivered: (restaurantId, itemName, quantity) => {
            const socket = chefSocketMap.get(String(restaurantId));
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                    type: "ITEM_DELIVERED",
                    itemName,
                    quantity
                }));
            }
        },
        // ================= Waiter sends to chef =================
        notifyChefItemUpdated: (restaurantId, updates) => {
            const socket = chefSocketMap.get(String(restaurantId));
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                    type: "CHEF_ITEM_UPDATED",
                    updates
                }));
            }
        },

        // ================= Owner sends to Worker =================
        notifySalaryUpdated: (workerId, newSalary) => {
            const socket = workerSocketMap.get(String(workerId));
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                    type: "SALARY_UPDATED",
                    salary: newSalary
                }));
            }
        }
    };
}

module.exports = setupWebSocket;