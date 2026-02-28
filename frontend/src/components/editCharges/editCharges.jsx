import React, { useState, useEffect } from "react";
import "./editCharges.css";

const EditCharges = ({ onClose }) => {
    const [gst, setGst] = useState("");
    const [serviceCharges, setServiceCharges] = useState("");
    const [initialGst, setInitialGst] = useState("");
    const [initialServiceCharges, setInitialServiceCharges] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        // Fetch initial values from /me/owner
        const fetchCharges = async () => {
            setLoading(true);
            setError("");
            try {
                const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
                const token = localStorage.getItem("token");
                const res = await fetch(`${backendUrl}/me/owner`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) throw new Error("Failed to fetch charges");
                const data = await res.json();
                const gstValue = data.user?.gst !== undefined
                    ? data.user.gst
                    : data.gst !== undefined
                        ? data.gst
                        : "";
                const serviceChargesValue = data.user?.serviceCharges !== undefined
                    ? data.user.serviceCharges
                    : data.serviceCharges !== undefined
                        ? data.serviceCharges
                        : "";
                setGst(gstValue);
                setInitialGst(gstValue);
                setServiceCharges(serviceChargesValue);
                setInitialServiceCharges(serviceChargesValue);
            } catch (err) {
                setError("Could not load charges.");
            }
            setLoading(false);
        };
        fetchCharges();
    }, []);

    const handleConfirm = async () => {
        setSaving(true);
        setError("");
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
            const token = localStorage.getItem("token");
            // Only send the fields that have changed
            const body = {};
            if (gst !== "" && String(gst) !== String(initialGst)) body.gst = Number(gst);
            if (serviceCharges !== "" && String(serviceCharges) !== String(initialServiceCharges)) body.serviceCharges = Number(serviceCharges);

            if (Object.keys(body).length === 0) {
                setError("No changes to update.");
                setSaving(false);
                return;
            }

            const res = await fetch(`${backendUrl}/edit-owner-profile`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const errText = await res.text();
                console.error("Update failed:", errText);
                throw new Error("Failed to update charges");
            }
            onClose();
        } catch (err) {
            setError("Could not update charges.");
        }
        setSaving(false);
    };

    return (
        <div className="edit-charges-modal">
            <div className="edit-charges-content">
                <h2>Edit Charges</h2>
                {loading ? (
                    <div>Loading...</div>
                ) : (
                    <>
                        <div className="edit-charges-fields">
                            <label>
                                GST (%):
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={gst}
                                    onChange={e => setGst(e.target.value)}
                                    disabled={saving}
                                    placeholder="GST in %"
                                />
                            </label>
                            <label>
                                Service Charges:
                                <input
                                    type="number"
                                    min="0"
                                    value={serviceCharges}
                                    onChange={e => setServiceCharges(e.target.value)}
                                    disabled={saving}
                                    placeholder="Service Charges"
                                />
                            </label>
                        </div>
                        {error && <div className="edit-charges-error">{error}</div>}
                        <div className="edit-charges-actions">
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

export default EditCharges;
