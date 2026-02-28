import React, { useEffect, useState } from "react";
import Navbar from "../../components/navbar/navbar";
import "./waiter.css";


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

const Waiter = () => {

    const [requests, setRequests] = useState([]); // {table, items, accepted}
    const [loading, setLoading] = useState(true);
    // Salary popup state
    const [salaryPopupMsg, setSalaryPopupMsg] = useState("");
    // Track which table is being edited (if any) by the waiter
    const [editingTable, setEditingTable] = useState(null);
    const [editedQuantities, setEditedQuantities] = useState({});
    // Track accepted/ignored tables
    const [tableStatus, setTableStatus] = useState({}); // { [table]: 'accepted' | 'ignored' }

    // Track delivered status for each item: { [table]: { [itemIdx]: true/false } }
    const [deliveredStatus, setDeliveredStatus] = useState({});

    // Fetch requests from backend
    const fetchRequests = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
            const res = await fetch(
                `${backendUrl}/get-confirmed-orders`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!res.ok) {
                throw new Error("Failed to fetch confirmed orders");
            }

            const data = await res.json();

            setRequests(Array.isArray(data.requests) ? data.requests : []);
        } catch (err) {
            console.error(err);
            setRequests([]);
        }
        setLoading(false);
    };


    //websocket for real-time updates like salary
    useEffect(() => {
        const backendUrl =
            import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
        const wsUrl = backendUrl.replace(/^http/, "ws");

        const socket = new WebSocket(wsUrl);

        socket.onopen = () => {
            socket.send(JSON.stringify({
                type: "JOIN_WORKER",
                workerId: localStorage.getItem("user_id")
            }));
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === "SALARY_UPDATED") {
                setSalaryPopupMsg(`💰 Your salary has been updated to ₹${data.salary}`);
            }
        };

        return () => socket.close();
    }, []);


    useEffect(() => {
        // 1️⃣ Fetch orders from backend
        fetchRequests();

        // 2️⃣ Restore accepted orders from localStorage
        const acceptedOrders =
            JSON.parse(localStorage.getItem("waiterAcceptedOrders")) || [];

        if (acceptedOrders.length > 0) {
            setTableStatus(prev => {
                const updated = { ...prev };
                acceptedOrders.forEach(confirmedOrderId => {
                    updated[confirmedOrderId] = "accepted";
                });
                return updated;
            });
        }
    }, []);


    const handleAccept = async (confirmedOrderId, table) => {
        try {
            const token = localStorage.getItem("token");
            const backendUrl =
                import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

            await fetch(`${backendUrl}/accept-confirmed-order`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ confirmedOrderId })
            });

            // ✅ STORE ACCEPTED ORDER LOCALLY
            const acceptedOrders =
                JSON.parse(localStorage.getItem("waiterAcceptedOrders")) || [];

            if (!acceptedOrders.includes(confirmedOrderId)) {
                acceptedOrders.push(confirmedOrderId);
                localStorage.setItem(
                    "waiterAcceptedOrders",
                    JSON.stringify(acceptedOrders)
                );
            }

            setTableStatus(prev => ({
                ...prev,
                [table]: "accepted"
            }));

            fetchRequests();
        } catch (err) {
            console.error("Accept order failed", err);
        }
    };

    const handleIgnore = (table) => {
        setTableStatus(prev => ({ ...prev, [table]: 'ignored' }));
    };

    // Toggle delivered status for an item
    const handleToggleDelivered = async (table, idx, item, restaurantId) => {
        if (deliveredStatus[table]?.[idx]) return;

        const token = localStorage.getItem("token");
        const backendUrl =
            import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

        await fetch(`${backendUrl}/mark-item-delivered`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                restaurantId: String(restaurantId),
                table,
                itemName: item.name,
                quantity: item.quantity
            })
        });

        setDeliveredStatus(prev => ({
            ...prev,
            [table]: { ...prev[table], [idx]: true }
        }));
    };

    return (
        <>
            <Navbar mode="waiter" dashboardTitle="Waiter Dashboard" />
            {salaryPopupMsg && (
                <OrderSetuPopup
                    message={salaryPopupMsg}
                    onClose={() => setSalaryPopupMsg("")}
                />
            )}
            <div className="waiter-requests-container">
                <div className="order-requests-header-bar">
                    <h2>Order Requests</h2>
                    <button className="refresh-btn" onClick={fetchRequests} title="Refresh requests">&#x21bb;</button>
                </div>
                {loading ? (
                    <div className="no-requests">Loading...</div>
                ) : requests.length === 0 ? (
                    <div className="no-requests">No order requests.</div>
                ) : (
                    requests
                        .filter(req => tableStatus[req.table] !== 'ignored')
                        .map((req) => (
                            <div
                                key={req.table}
                                className={`order-request-card ${editingTable === req.table ? "editing" : ""
                                    }`}
                            >
                                <div className="order-request-header">
                                    <span className="table-number">Table #{req.table}</span>
                                    {tableStatus[req.table] !== 'accepted' && (
                                        <div className="order-request-actions">
                                            <button className="accept-btn" onClick={() => handleAccept(req.confirmedOrderId, req.table)}> Accept </button>
                                            <button className="ignore-btn" onClick={() => handleIgnore(req.table)}>Ignore</button>
                                        </div>
                                    )}
                                </div>
                                {tableStatus[req.table] === 'accepted' && (
                                    <div className="order-items">
                                        <div className="order-items-header">
                                            <strong>Items:</strong>
                                            <button
                                                className="edit-btn"
                                                onClick={() => {
                                                    if (editingTable === req.table) {
                                                        // CLOSE edit mode
                                                        setEditingTable(null);
                                                        setEditedQuantities({});
                                                    } else {
                                                        // OPEN edit mode
                                                        setEditingTable(req.table);

                                                        const initial = {};
                                                        req.items.forEach(item => {
                                                            initial[`${req.confirmedOrderId}-${item.name}`] = item.quantity;
                                                        });
                                                        setEditedQuantities(initial);
                                                    }
                                                }}
                                            >
                                                {editingTable === req.table ? "Close" : "Edit"}
                                            </button>
                                        </div>
                                        <ul>
                                            {req.items.map((item, idx) => {
                                                const key = `${req.confirmedOrderId}-${item.name}`;

                                                const editedQty =
                                                    editedQuantities[key] !== undefined
                                                        ? editedQuantities[key]
                                                        : item.quantity;

                                                return (
                                                    <li key={idx} className="order-item-row">
                                                        <span className="item-name">{item.name}</span>

                                                        {/* READ MODE */}
                                                        {editingTable !== req.table && (
                                                            <span className="item-quantity">x{item.quantity}</span>
                                                        )}

                                                        {/* EDIT MODE */}
                                                        {editingTable === req.table && (
                                                            <div className="edit-controls">
                                                                <div className="qty-control">
                                                                    <button
                                                                        className="qty-btn"
                                                                        onClick={() =>
                                                                            setEditedQuantities(prev => ({
                                                                                ...prev,
                                                                                [key]: Math.max(1, editedQty - 1)
                                                                            }))
                                                                        }
                                                                    >
                                                                        −
                                                                    </button>

                                                                    <span className="qty-value">{editedQty}</span>

                                                                    <button
                                                                        className="qty-btn"
                                                                        onClick={() =>
                                                                            setEditedQuantities(prev => ({
                                                                                ...prev,
                                                                                [key]: editedQty + 1
                                                                            }))
                                                                        }
                                                                    >
                                                                        +
                                                                    </button>
                                                                </div>

                                                                {editedQty !== item.quantity && (
                                                                    <button
                                                                        className="save-btn"
                                                                        onClick={async () => {
                                                                            const token = localStorage.getItem("token");
                                                                            const backendUrl =
                                                                                import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

                                                                            await fetch(`${backendUrl}/update-confirmed-item`, {
                                                                                method: "PATCH",
                                                                                headers: {
                                                                                    Authorization: `Bearer ${token}`,
                                                                                    "Content-Type": "application/json"
                                                                                },
                                                                                body: JSON.stringify({
                                                                                    confirmedOrderId: req.confirmedOrderId,
                                                                                    itemName: item.name,
                                                                                    quantity: editedQty
                                                                                })
                                                                            });

                                                                            fetchRequests();
                                                                        }}
                                                                    >
                                                                        Save
                                                                    </button>
                                                                )}

                                                                <button
                                                                    className="remove-btn"
                                                                    onClick={async () => {
                                                                        const token = localStorage.getItem("token");
                                                                        const backendUrl =
                                                                            import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

                                                                        await fetch(`${backendUrl}/update-confirmed-item`, {
                                                                            method: "PATCH",
                                                                            headers: {
                                                                                Authorization: `Bearer ${token}`,
                                                                                "Content-Type": "application/json"
                                                                            },
                                                                            body: JSON.stringify({
                                                                                confirmedOrderId: req.confirmedOrderId,
                                                                                itemName: item.name,
                                                                                quantity: 0
                                                                            })
                                                                        });

                                                                        fetchRequests();
                                                                    }}
                                                                >
                                                                    🗑
                                                                </button>
                                                            </div>
                                                        )}

                                                        {/* DELIVERED BUTTON */}
                                                        {editingTable !== req.table && (
                                                            <button
                                                                className={`delivered-btn ${deliveredStatus[req.table]?.[idx] ? "delivered" : ""
                                                                    }`}
                                                                onClick={() =>
                                                                    handleToggleDelivered(
                                                                        req.table,
                                                                        idx,
                                                                        item,
                                                                        req.restaurant_id
                                                                    )
                                                                }
                                                            >
                                                                {deliveredStatus[req.table]?.[idx]
                                                                    ? "Delivered"
                                                                    : "Not Delivered"}
                                                            </button>
                                                        )}
                                                    </li>
                                                );
                                            })}
                                        </ul>

                                        {/* ✅ COMPLETED BUTTON – PER ORDER */}
                                        <div className="completed-wrapper">
                                            <button
                                                className="completed-btn"
                                                onClick={() => {
                                                    const accepted =
                                                        JSON.parse(localStorage.getItem("waiterAcceptedOrders")) || [];

                                                    const updated = accepted.filter(
                                                        id => id !== req.confirmedOrderId
                                                    );

                                                    localStorage.setItem(
                                                        "waiterAcceptedOrders",
                                                        JSON.stringify(updated)
                                                    );

                                                    fetchRequests();
                                                }}
                                            >
                                                Completed
                                            </button>
                                        </div>

                                    </div>
                                )}
                            </div>
                        ))
                )}
            </div>
        </>
    );
};

export default Waiter;