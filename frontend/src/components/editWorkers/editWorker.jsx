import React, { useEffect, useState } from "react";
import "./editWorker.css";

// OrderSetu Popup Component
const OrderSetuPopup = ({ message, onClose }) => (
    <div className="ordersetu-popup-overlay">
        <div className="ordersetu-popup-box">
            <div className="ordersetu-popup-message">{message}</div>
            <button className="ordersetu-popup-close-btn" onClick={onClose}>OK</button>
        </div>
    </div>
);

// OrderSetu Confirm Dialog
const OrderSetuConfirm = ({ message, onConfirm, onCancel }) => (
    <div className="ordersetu-popup-overlay">
        <div className="ordersetu-popup-box">
            <div className="ordersetu-popup-message">{message}</div>
            <div className="ordersetu-popup-actions">
                <button className="ordersetu-popup-close-btn" onClick={onCancel}>Cancel</button>
                <button className="ordersetu-popup-confirm-btn" onClick={onConfirm}>Yes</button>
            </div>
        </div>
    </div>
);

const EditWorker = ({ onClose }) => {
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editPopup, setEditPopup] = useState(false);
    const [editWorker, setEditWorker] = useState(null);
    const [editSalary, setEditSalary] = useState("");

    // Popup state
    const [popupMessage, setPopupMessage] = useState("");
    const [confirmDialog, setConfirmDialog] = useState(null); // { workerId, message }
    const showPopup = (msg) => setPopupMessage(msg);
    const closePopup = () => setPopupMessage("");
    useEffect(() => {
        const fetchWorkers = async () => {
            setLoading(true);
            try {
                const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
                const token = localStorage.getItem("token");
                const res = await fetch(`${backendUrl}/get-all-Workers`, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                });
                if (res.ok) {
                    const data = await res.json();
                    setWorkers(data.workers || []);
                }
            } catch {
                setWorkers([]);
            }
            setLoading(false);
        };
        fetchWorkers();
    }, []);

    const handleEdit = (worker) => {
        setEditWorker(worker);
        setEditSalary(worker.salary);
        setEditPopup(true);
    };

    const handleEditSalaryChange = (e) => {
        setEditSalary(e.target.value);
    };

    const handleEditSave = async () => {
        if (!editWorker) return;
        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`${backendUrl}/edit-worker-profile`, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    _id: editWorker._id,
                    salary: editSalary
                })
            });
            if (res.ok) {
                setWorkers(prev =>
                    prev.map(w =>
                        w._id === editWorker._id ? { ...w, salary: editSalary } : w
                    )
                );
                setEditPopup(false);
                setEditWorker(null);
            } else {
                showPopup("Failed to update salary.");
            }
        } catch {
            showPopup("Error updating salary.");
        }
    };

    const handleEditCancel = () => {
        setEditPopup(false);
        setEditWorker(null);
    };

    const handleRemove = (workerId) => {
        setConfirmDialog({
            workerId,
            message: "Are you sure you want to remove this worker?"
        });
    };

    const confirmRemove = async (workerId) => {
        setConfirmDialog(null);
        setLoading(true);
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
            const token = localStorage.getItem("token");
            const res = await fetch(`${backendUrl}/delete-worker/${workerId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
            if (res.ok) {
                setWorkers(prev => prev.filter(w => w._id !== workerId));
            } else {
                showPopup("Failed to remove worker.");
            }
        } catch {
            showPopup("Error removing worker.");
        }
        setLoading(false);
    };

    return (
        <>
            {popupMessage && (
                <OrderSetuPopup message={popupMessage} onClose={closePopup} />
            )}
            {confirmDialog && (
                <OrderSetuConfirm
                    message={confirmDialog.message}
                    onCancel={() => setConfirmDialog(null)}
                    onConfirm={() => confirmRemove(confirmDialog.workerId)}
                />
            )}
            <div className="edit-worker-popup">
                <div className="edit-worker-header">
                    <span>Workers</span>
                    <button className="edit-worker-close" onClick={onClose}>×</button>
                </div>
                <div className="edit-worker-body">
                    {loading ? (
                        <div className="edit-worker-loading">Loading...</div>
                    ) : workers.length === 0 ? (
                        <div className="edit-worker-empty">No workers found.</div>
                    ) : (
                        <table className="edit-worker-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Type</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {workers.map(worker => (
                                    <tr key={worker._id}>
                                        <td>{worker.name}</td>
                                        <td>{worker.type}</td>
                                        <td>
                                            <button className="edit-worker-btn" onClick={() => handleEdit(worker)}>Edit</button>
                                            <button className="remove-worker-btn" onClick={() => handleRemove(worker._id)}>🗑</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                {editPopup && editWorker && (
                    <div className="edit-worker-modal">
                        <div className="edit-worker-modal-content">
                            <h3>Edit Salary</h3>
                            <div>
                                <b>Name:</b> {editWorker.name}
                            </div>
                            <div>
                                <b>Type:</b> {editWorker.type}
                            </div>
                            <div>
                                <b>Current Salary:</b> {editWorker.salary}
                            </div>
                            <div>
                                <label>
                                    New Salary:
                                    <input
                                        type="number"
                                        value={editSalary}
                                        onChange={handleEditSalaryChange}
                                        min="0"
                                    />
                                </label>
                            </div>
                            <div className="edit-worker-modal-actions">
                                <button onClick={handleEditSave} className="edit-worker-save-btn">Save</button>
                                <button onClick={handleEditCancel} className="edit-worker-cancel-btn">Cancel</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default EditWorker;
