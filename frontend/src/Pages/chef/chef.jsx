

import React, { useState, useRef, useEffect } from "react";
import Navbar from "../../components/navbar/navbar";
import "./chef.css";



// OrderSetu Popup Component (Salary Update)
const OrderSetuPopup = ({ message, onClose }) => (
    <div className="ordersetu-popup-overlay">
        <div className="ordersetu-popup-box">
            <div className="ordersetu-popup-message">{message}</div>
            <button
                className="ordersetu-popup-close-btn"
                onClick={onClose}
            >
                OK
            </button>
        </div>
    </div>
);

const Chef = () => {
    const [wsMessage, setWsMessage] = useState("");
    const [items, setItems] = useState([]);
    const [salaryPopupMsg, setSalaryPopupMsg] = useState("");
    const socketRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const fetchedOnce = useRef(false);
    const [chefPopupMsg, setChefPopupMsg] = useState("");
    const fetchSummary = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
            const res = await fetch(
                `${backendUrl}/chef-item-summary`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            const data = await res.json();
            setItems(Array.isArray(data.items) ? data.items : []);
        } catch (err) {
            console.error(err);
            setItems([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (fetchedOnce.current) return;

        fetchSummary();
        fetchedOnce.current = true;
    }, []);



    useEffect(() => {
        const backendUrl =
            import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
        const wsUrl = backendUrl.replace(/^http/, "ws");
        if (socketRef.current) return;
        const socket = new WebSocket(wsUrl);
        socketRef.current = socket;
        socket.onopen = () => {
            const token = localStorage.getItem("token");

            if (!token) {
                console.error("No token found for chef");
                return;
            }

            const tokenPayload = JSON.parse(
                atob(token.split(".")[1])
            );

            // 🔴 IMPORTANT: this must exist
            const restaurantId = tokenPayload.restaurant_id;

            if (!restaurantId) {
                console.error("restaurant_id missing in token payload", tokenPayload);
                return;
            }

            socket.send(JSON.stringify({
                type: "JOIN_CHEF",
                restaurantId: restaurantId
            }));
        };
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            // 🆕 ORDER ACCEPTED
            if (data.type === "ORDER_ACCEPTED") {
                const itemsText = data.items
                    .map(i => `${i.item_name} x${i.quantity}`)
                    .join(", ");

                // 🔔 POPUP MESSAGE
                setChefPopupMsg(`🍳 Order Confirmed: ${itemsText}`);

                // ⏱ Auto close after 15 seconds
                setTimeout(() => {
                    setChefPopupMsg("");
                }, 15000);

                // 🔄 Refresh summary from backend
                fetchSummary();
            }
            // 🔄 ITEM UPDATED BY WAITER
            if (data.type === "CHEF_ITEM_UPDATED") {
                const updatesText = data.updates
                    .map(u => {
                        if (u.action === "removed") {
                            return `❌ ${u.itemName} removed`;
                        }
                        return `✏️ ${u.itemName}: ${u.oldQty} → ${u.newQty}`;
                    })
                    .join(", ");

                setChefPopupMsg(`📝 Order updated: ${updatesText}`);

                setTimeout(() => {
                    setChefPopupMsg("");
                }, 15000);

                // 🔄 Refresh summary automatically
                fetchSummary();
            }
            // ✅ ITEM DELIVERED
            if (data.type === "ITEM_DELIVERED") {
                // 🔔 POPUP MESSAGE
                setChefPopupMsg(`✅ Delivered: ${data.itemName} x${data.quantity}`);

                // ⏱ Auto close after 15 seconds
                setTimeout(() => {
                    setChefPopupMsg("");
                }, 5000);

                // 🔄 Refresh summary from backend
                fetchSummary();
            }

            // 💰 SALARY UPDATED
            if (data.type === "SALARY_UPDATED") {
                setSalaryPopupMsg(`💰 Your salary has been updated to ₹${data.salary}`);
            }
        };
        socket.onerror = () => {
            console.warn("⚠️ WebSocket error (chef)");
        };
        socket.onclose = () => {
            console.warn("⚠️ WebSocket closed (chef)");
        };
        return () => {
            if (socketRef.current?.readyState === WebSocket.OPEN) {
                socketRef.current.close();
            }
            socketRef.current = null;
        };
    }, []);

    return (
        <>
            <Navbar mode="chef" dashboardTitle="Chef Dashboard" />
            {salaryPopupMsg && (
                <OrderSetuPopup
                    message={salaryPopupMsg}
                    onClose={() => setSalaryPopupMsg("")}
                />
            )}
            {chefPopupMsg && (
                <div className="chef-popup">
                    {chefPopupMsg}
                </div>
            )}
            {wsMessage && (
                <div className="chef-ws-message">
                    {wsMessage}
                </div>
            )}
            {/* NEW WRAPPER */}
            <div className="chef-page">
                <div className="chef-container">
                    <h2>Item Summary</h2>
                    {loading ? (
                        <p className="chef-empty">Loading...</p>
                    ) : items.length === 0 ? (
                        <p className="chef-empty">No items found.</p>
                    ) : (
                        <div className="chef-items">
                            {items.map((item, idx) => (
                                <div className="chef-item-card" key={idx}>
                                    <span className="chef-item-name">
                                        {item.item}
                                    </span>
                                    <span className="chef-item-qty">
                                        {item.quantity}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Chef;