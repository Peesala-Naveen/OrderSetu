import React, { useEffect, useState } from "react";
import "./joinRequest.css";

const JoinRequest = ({ onClose }) => {
    const [joinRequests, setJoinRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [salaryEdits, setSalaryEdits] = useState({});

    useEffect(() => {
        const fetchJoinRequests = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem("token");
                const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
                // Fetch owner info to get MongoDB _id
                let ownerMongoId = null;
                try {
                    const meRes = await fetch(`${backendUrl}/me/owner`, {
                        method: "GET",
                        headers: {
                            "Authorization": `Bearer ${token}`,
                            "Content-Type": "application/json"
                        }
                    });
                    if (meRes.ok) {
                        const meData = await meRes.json();
                        ownerMongoId = meData.user?._id || null;
                    }
                } catch (e) {
                    // ignore error
                }

                const res = await fetch(`${backendUrl}/join-requests`, {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                });
                if (res.status === 401 || res.status === 403) {
                    localStorage.removeItem("token");
                    window.location.href = "/login";
                    return;
                }
                if (res.ok) {
                    const data = await res.json();
                    const rawRequests = Array.isArray(data) ? data : (Array.isArray(data.requests) ? data.requests : []);
                    // Filter requests by restaurant_id (owner's MongoDB _id)
                    const filtered = ownerMongoId
                        ? rawRequests.filter(req =>
                            req.restaurant_id === ownerMongoId ||
                            (req.restaurant_id && req.restaurant_id.toString && req.restaurant_id.toString() === ownerMongoId)
                        )
                        : rawRequests;

                    const mapped = filtered.map(req => ({
                        ...req,
                        mobile: req.mobile || req.mobileNumber || "",
                        role: req.role || req.type || "",
                        salary: req.salary || 0,
                        name: req.name || "",
                        email: req.email || "",
                        _id: req._id,
                    }));

                    setJoinRequests(mapped);
                } else {
                    setJoinRequests([]);
                }
            } catch (err) {
                setJoinRequests([]);
            }
            setLoading(false);
        };
        fetchJoinRequests();
    }, []);

    const handleSalaryChange = (id, value) => {
        setSalaryEdits(prev => ({ ...prev, [id]: value }));
    };

    const handleAcceptJoinRequest = async (req) => {
        const token = localStorage.getItem("token");
        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
        if (!token) {
            window.location.href = "/login";
            return;
        }
        const salary = salaryEdits[req._id] || req.salary;
        try {
            const res = await fetch(`${backendUrl}/join-requests/${req._id}/status`, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ status: "Accepted", salary }) // Capital A
            });
            if (res.status === 401 || res.status === 403) {
                localStorage.removeItem("token");
                window.location.href = "/login";
                return;
            }
            if (res.ok) {
                setJoinRequests(requests => requests.filter(r => r._id !== req._id));
            } else {
                // Optionally show error to user
                const err = await res.json();
                alert(err.message || "Failed to accept join request.");
            }
        } catch (err) {
            // Optionally show error to user
            alert("Network error while accepting join request.");
        }
    };

    const handleRejectJoinRequest = async (req) => {
        const token = localStorage.getItem("token");
        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
        if (!token) {
            window.location.href = "/login";
            return;
        }
        try {
            const res = await fetch(`${backendUrl}/join-requests/${req._id}/status`, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ status: "Rejected" }) // Use "Rejected" for backend mapping
            });
            if (res.status === 401 || res.status === 403) {
                localStorage.removeItem("token");
                window.location.href = "/login";
                return;
            }
            if (res.ok) {
                setJoinRequests(requests => requests.filter(r => r._id !== req._id));
            }
        } catch (err) {
            // Optionally show error to user
        }
    };

    return (
        <div className="join-requests-modal-overlay">
            <div className="join-requests-modal">
                <div className="join-requests-header">
                    Join Requests
                </div>
                <button
                    className="close-btn"
                    onClick={onClose}
                >
                    ×
                </button>
                {loading ? (
                    <div className="join-requests-loading">Loading...</div>
                ) : joinRequests.length === 0 ? (
                    <div className="join-requests-empty">No join requests.</div>
                ) : (
                    <div className="join-requests-list">
                        {joinRequests.map(req => (
                            <div
                                key={req._id}
                                className="join-request-card"
                            >
                                <div className="join-request-name">{req.name}</div>
                                <div><b>Role:</b> <span className="join-request-role">{req.role}</span></div>
                                <div>
                                    <b>Salary:</b>
                                    <input
                                        type="number"
                                        value={salaryEdits[req._id] ?? req.salary}
                                        onChange={e => handleSalaryChange(req._id, e.target.value)}
                                        className="join-request-salary-input"
                                    />
                                </div>
                                <div><b>Mobile:</b> {req.mobile}</div>
                                <div><b>Email:</b> {req.email}</div>
                                <div className="join-request-actions">
                                    <button
                                        className="accept-btn"
                                        onClick={() => handleAcceptJoinRequest(req)}
                                    >
                                        Accept
                                    </button>
                                    <button
                                        className="reject-btn"
                                        onClick={() => handleRejectJoinRequest(req)}
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default JoinRequest;
