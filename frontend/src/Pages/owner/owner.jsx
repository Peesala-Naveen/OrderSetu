import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/navbar/navbar";
import Bill from "../../components/bill/bill";
import "./owner.css";

const Owner = () => {
    const [paymentRequests, setPaymentRequests] = useState([]);
    const [viewBill, setViewBill] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [ownerInfo, setOwnerInfo] = useState({ gst: 0, serviceCharges: 0 });
    const [message, setMessage] = useState(""); // For showing update success
    const navigate = useNavigate();

    // Fetch owner info (GST, Service Charges) on mount
    useEffect(() => {
        const fetchOwnerInfo = async () => {
            try {
                const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
                const token = localStorage.getItem("token");
                const res = await fetch(`${backendUrl}/me/owner`, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                });
                if (res.ok) {
                    const data = await res.json();
                    setOwnerInfo({
                        gst: Number(data.user.gst) || 0,
                        serviceCharges: Number(data.user.serviceCharges) || 0
                    });
                }
            } catch (err) {
                setOwnerInfo({ gst: 0, serviceCharges: 0 });
            }
        };
        fetchOwnerInfo();
    }, []);

    // Fetch payment requests from backend
    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
            const token = localStorage.getItem("token");
            const res = await fetch(`${backendUrl}/get-bill-request`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
            if (res.ok) {
                const data = await res.json();
                // Only keep bills with paymentStatus 'Pending'
                setPaymentRequests(
                    (data.bills || [])
                        .filter(bill => bill.paymentStatus === "Pending")
                        .map(bill => ({
                            requestId: bill.requestId || bill._id,
                            confirmedOrderId: bill.confirmedOrderId,
                            totalAmount: bill.grandTotal || bill.total || 0,
                            bill: {
                                ...bill,
                                items: bill.items || [],
                                total: bill.grandTotal || bill.total || 0
                            }
                        }))
                );
            }
        } catch (err) {
            // Optionally handle error
        }
        setRefreshing(false);
    };

    // Delete confirmed order from database (by ConfirmedOrder _id)
    const deleteConfirmedOrder = async (confirmedOrderId) => {
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
            const token = localStorage.getItem("token"); // ✅ OWNER TOKEN

            const res = await fetch(
                `${backendUrl}/delete-confirmed-orders/${confirmedOrderId}`,
                {
                    method: "DELETE",
                    headers: {
                        "Authorization": `Bearer ${token}`, // ✅ REQUIRED
                        "Content-Type": "application/json"
                    }
                }
            );

            if (!res.ok) {
                const err = await res.json();
                console.error(" Delete failed:", err.message);
            }
        } catch (error) {
            console.error(" Error deleting confirmed order:", error);
        }
    };
    // Update payment status on backend and update UI

    const updatePaymentStatus = async (requestId, status) => {
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
            const token = localStorage.getItem("token");

            const req = paymentRequests.find(r => r.requestId === requestId);
            if (!req) return;

            const billId = req.bill._id;
            const confirmedOrderId = req.confirmedOrderId; // ✅ THIS IS THE KEY

            const res = await fetch(`${backendUrl}/edit-payment-status/${billId}`, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ paymentStatus: status })
            });

            if (res.ok) {
                if (status === "Accepted" && confirmedOrderId) {
                    await deleteConfirmedOrder(confirmedOrderId); // ✅ CORRECT
                }

                setPaymentRequests(prev =>
                    prev.filter(r => r.requestId !== requestId)
                );

                setViewBill(null);
                setMessage("Updated successfully");
                setTimeout(() => setMessage(""), 2000);
            }
        } catch (err) {
            setMessage("Failed to update status");
            setTimeout(() => setMessage(""), 2000);
        }
    };
    const handleAccept = (requestId) => {
        updatePaymentStatus(requestId, "Accepted");
    };

    const handleReject = (requestId) => {
        updatePaymentStatus(requestId, "Rejected");
    };

    return (
        <>
            <Navbar mode="owner" dashboardTitle="Owner Dashboard" />
            {message && (
                <div className="owner-update-message">{message}</div>
            )}
            <div className="owner-payment-requests">
                <div className="owner-payment-requests-header">
                    <h2>Payment Requests</h2>
                    {!refreshing && (
                        <button
                            className="owner-refresh-btn"
                            onClick={handleRefresh}
                            title="Refresh"
                        >
                            &#x21bb;
                        </button>
                    )}
                    {refreshing && (
                        <span className="owner-refreshing-spinner" title="Refreshing...">⏳</span>
                    )}
                </div>
                {paymentRequests.length === 0 && (
                    <div className="owner-no-requests">No payment requests at the moment.</div>
                )}
                {paymentRequests.map(req => (
                    <div key={req.requestId} className="owner-payment-request-card">
                        <div><b>Request ID:</b> {req.requestId}</div>
                        <div><b>Total Amount:</b> ₹{req.totalAmount}</div>
                        <div className="owner-payment-actions">
                            <button
                                className="owner-btn owner-view-bill"
                                onClick={() => setViewBill(req)}
                            >
                                View Bill
                            </button>
                            <button
                                className="owner-btn owner-accept"
                                onClick={() => handleAccept(req.requestId)}
                            >
                                Accept
                            </button>
                            <button
                                className="owner-btn owner-reject"
                                onClick={() => handleReject(req.requestId)}
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            {viewBill && (
                <div className="owner-bill-modal-overlay">
                    <div className="owner-bill-modal">
                        <h3>Bill Details</h3>
                        <div>
                            <b>Request ID:</b> {viewBill.requestId}
                        </div>
                        <Bill
                            items={viewBill.bill.items}
                            gst={ownerInfo.gst}
                            serviceCharges={ownerInfo.serviceCharges}
                        />
                        <div className="owner-bill-modal-actions">
                            <button
                                className="owner-btn owner-close"
                                onClick={() => setViewBill(null)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Owner;