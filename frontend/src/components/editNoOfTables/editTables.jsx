import React, { useState, useEffect } from "react";
import "./editTables.css";

const EditTables = ({ onClose }) => {
    const [tables, setTables] = useState(1);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        // Initially get the number of tables from GET /me/owner using token in localStorage
        const fetchTables = async () => {
            setLoading(true);
            setError("");
            try {
                const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
                const token = localStorage.getItem("token");
                const res = await fetch(`${backendUrl}/me/owner`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) throw new Error("Failed to fetch tables");
                const data = await res.json();
                // Use the correct field name: table
                setTables(data.user?.table || data.table || 1);
            } catch (err) {
                setError("Could not load table count.");
            }
            setLoading(false);
        };
        fetchTables();
    }, []);

    const handleChange = (delta) => {
        setTables((prev) => Math.max(1, prev + delta));
    };

    const handleConfirm = async () => {
        setSaving(true);
        setError("");
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
            const token = localStorage.getItem("token");
            const res = await fetch(`${backendUrl}/edit-owner-profile`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                // Use the correct field name: table
                body: JSON.stringify({ table: tables }),
            });
            if (!res.ok) {
                const errText = await res.text();
                console.error("Update failed:", errText);
                throw new Error("Failed to update tables");
            }
            onClose();
        } catch (err) {
            setError("Could not update table count.");
        }
        setSaving(false);
    };

    return (
        <div className="edit-tables-modal">
            <div className="edit-tables-content">
                <h2>Edit Number of Tables</h2>
                {loading ? (
                    <div>Loading...</div>
                ) : (
                    <>
                        <div className="tables-quantity-changer">
                            <button onClick={() => handleChange(-1)} disabled={tables <= 1 || saving}>-</button>
                            <span>{tables}</span>
                            <button onClick={() => handleChange(1)} disabled={saving}>+</button>
                        </div>
                        {error && <div className="edit-tables-error">{error}</div>}
                        <div className="edit-tables-actions">
                            <button onClick={handleConfirm} disabled={saving}>
                                {saving ? "Saving..." : "Confirm"}
                            </button>
                            <button onClick={onClose} disabled={saving}>Cancel</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default EditTables;
