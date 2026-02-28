import React, { useState, useEffect } from "react";
import "./editProfile.css";

// Field configs for owner and worker
const ownerFields = [
    { key: "restaurantName", label: "Restaurant Name", type: "text" },
    { key: "ownerName", label: "Owner Name", type: "text" },
    { key: "mobileNumber", label: "Mobile Number", type: "text" },
    { key: "email", label: "Email", type: "email" },
    { key: "address", label: "Address", type: "text" },
    { key: "password", label: "Password", type: "password" }
];
const workerFields = [
    { key: "name", label: "Name", type: "text" },
    { key: "mobileNumber", label: "Mobile Number", type: "text" },
    { key: "email", label: "Email", type: "email" },
    { key: "password", label: "Password", type: "password" }
];

const EditProfile = ({ onClose, mode = "owner" }) => {
    // Owner and Worker initial state
    const ownerInitial = {
        restaurantId: "",
        restaurantName: "",
        ownerName: "",
        type: "owner",
        mobileNumber: "",
        email: "",
        address: "",
        password: "",
        roles: [],
        table: 1,
        serviceCharges: 0,
        gst: 0,
        token: ""
    };
    const workerInitial = {
        name: "",
        mobileNumber: "",
        email: "",
        password: ""
    };
    const [form, setForm] = useState(mode === "owner" ? ownerInitial : workerInitial);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [editingField, setEditingField] = useState(null);
    const [editFieldValue, setEditFieldValue] = useState("");
    const [originalProfile, setOriginalProfile] = useState(null);

    // For password change flow
    const [passwordStep, setPasswordStep] = useState(null); // null | "verify" | "new"
    const [currentPassword, setCurrentPassword] = useState("");
    const [currentPasswordError, setCurrentPasswordError] = useState("");
    const [currentPasswordVisible, setCurrentPasswordVisible] = useState(false);
    const [newPasswordVisible, setNewPasswordVisible] = useState(false);
    const [fetchedPassword, setFetchedPassword] = useState(""); // For demo only
    const [passwordVerified, setPasswordVerified] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            setError("");
            try {
                const token = localStorage.getItem("token");
                const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
                let url = "";
                if (mode === "owner") {
                    url = `${backendUrl}/me/owner`;
                } else {
                    url = `${backendUrl}/me/worker`; // <-- use worker endpoint for all non-owner
                }
                const res = await fetch(url, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                });
                if (res.ok) {
                    const data = await res.json();
                    const user = data.user || {};
                    if (mode === "owner") {
                        setForm({
                            restaurantId: user.restaurantId || "",
                            restaurantName: user.restaurantName || "",
                            ownerName: user.ownerName || "",
                            type: user.type || "owner",
                            mobileNumber: user.mobileNumber || "",
                            email: user.email || "",
                            address: user.address || "",
                            password: "",
                            roles: user.roles || [],
                            table: user.table || 1,
                            serviceCharges: user.serviceCharges || 0,
                            gst: user.gst || 0,
                            token: user.token || ""
                        });
                        setOriginalProfile({
                            restaurantId: user.restaurantId || "",
                            restaurantName: user.restaurantName || "",
                            ownerName: user.ownerName || "",
                            type: user.type || "owner",
                            mobileNumber: user.mobileNumber || "",
                            email: user.email || "",
                            address: user.address || "",
                            password: "",
                            roles: user.roles || [],
                            table: user.table || 1,
                            serviceCharges: user.serviceCharges || 0,
                            gst: user.gst || 0,
                            token: user.token || ""
                        });
                    } else {
                        setForm({
                            name: user.name || "",
                            mobileNumber: user.mobileNumber || "",
                            email: user.email || "",
                            password: ""
                        });
                        setOriginalProfile({
                            name: user.name || "",
                            mobileNumber: user.mobileNumber || "",
                            email: user.email || "",
                            password: ""
                        });
                    }
                } else {
                    setError("Failed to load profile");
                }
            } catch {
                setError("Failed to load profile");
            }
            setLoading(false);
        };
        fetchProfile();
    }, [mode]);

    const handleEditField = async (key) => {
        if (key === "password") {
            setPasswordStep("verify");
            setEditingField("password");
            setCurrentPassword("");
            setEditFieldValue("");
            setError("");
            setPasswordVerified(false);
            setCurrentPasswordError("");
        } else {
            setEditingField(key);
            setEditFieldValue(form[key] ?? "");
        }
    };

    const handleEditFieldChange = (e) => {
        setEditFieldValue(e.target.value);
    };

    const handleCancelEditField = () => {
        setPasswordStep(null);
        setCurrentPassword("");
        setEditFieldValue("");
        setError("");
        setPasswordVerified(false);
        if (originalProfile && editingField && editingField !== "password") {
            setForm(prev => ({
                ...prev,
                [editingField]: originalProfile[editingField]
            }));
        }
        setEditingField(null);
    };

    const handleVerifyCurrentPassword = async () => {
        setCurrentPasswordError("");
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
            const res = await fetch(`${backendUrl}/verify-password`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ currentPassword })
            });
            if (res.ok) {
                setPasswordVerified(true);
                setPasswordStep("new");
            } else {
                const data = await res.json();
                setCurrentPasswordError(data.message || "Current password is incorrect.");
            }
        } catch {
            setCurrentPasswordError("Failed to verify password.");
        }
        setLoading(false);
    };

    const handleConfirmEditField = async () => {
        setLoading(true);
        setError("");
        setSuccess("");
        try {
            const token = localStorage.getItem("token");
            const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
            let endpoint = "";
            let payload = {};
            if (mode === "owner") {
                endpoint = "/edit-owner-profile";
                if (editingField === "password") {
                    payload = {
                        restaurantId: form.restaurantId,
                        password: editFieldValue
                    };
                } else {
                    payload = {
                        restaurantId: form.restaurantId,
                        [editingField]: editFieldValue
                    };
                }
            } else {
                endpoint = "/edit-worker-profile";
                if (editingField === "password") {
                    payload = { password: editFieldValue };
                } else {
                    payload = { [editingField]: editFieldValue };
                }
            }
            const res = await fetch(`${backendUrl}${endpoint}`, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setSuccess("Updated successfully!");
                setTimeout(() => setSuccess(""), 1200);
                setForm(prev => ({
                    ...prev,
                    password: ""
                }));
                setOriginalProfile(prev => ({
                    ...prev,
                    password: ""
                }));
                setEditingField(null);
                setEditFieldValue("");
            } else {
                const data = await res.json();
                setError(data.message || "Failed to update profile");
            }
        } catch {
            setError("Failed to update profile");
        }
        setLoading(false);
    };

    // Render fields based on mode
    const fields = mode === "owner" ? ownerFields : workerFields;
    const header = mode === "owner" ? "Owner Profile" : "Worker Profile";

    return (
        <div className="ordersetu-profile-popup-overlay">
            <div className="ordersetu-profile-popup">
                <div className="ordersetu-profile-header">
                    {header}
                    <button
                        className="ordersetu-profile-close"
                        onClick={onClose}
                        type="button"
                    >×</button>
                </div>
                <form className="ordersetu-profile-form" onSubmit={e => e.preventDefault()}>
                    {fields.map(field => (
                        <div className="ordersetu-profile-field" key={field.key}>
                            <label htmlFor={`profile-${field.key}`}>{field.label}</label>
                            {editingField === field.key ? (
                                field.key === "password" ? (
                                    passwordStep === "verify" ? (
                                        <>
                                            <div style={{ display: "flex", alignItems: "center" }}>
                                                <input
                                                    id="profile-password-current"
                                                    type={currentPasswordVisible ? "text" : "password"}
                                                    name="currentPassword"
                                                    value={currentPassword}
                                                    onChange={e => setCurrentPassword(e.target.value)}
                                                    className="ordersetu-profile-input"
                                                    placeholder="Enter current password"
                                                    autoFocus
                                                />
                                                <span
                                                    style={{ cursor: "pointer", marginLeft: 8 }}
                                                    onClick={() => setCurrentPasswordVisible(v => !v)}
                                                    tabIndex={0}
                                                    aria-label="Toggle password visibility"
                                                >
                                                    {currentPasswordVisible ? "👁️" : "🙈"}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                className="ordersetu-profile-edit-confirm"
                                                onClick={handleVerifyCurrentPassword}
                                                disabled={loading || !currentPassword}
                                            >Verify</button>
                                            <button
                                                type="button"
                                                className="ordersetu-profile-edit-cancel"
                                                onClick={handleCancelEditField}
                                                disabled={loading}
                                            >✖️</button>
                                            {currentPasswordError && (
                                                <div className="ordersetu-profile-error">{currentPasswordError}</div>
                                            )}
                                            {passwordVerified && (
                                                <div className="ordersetu-profile-success">Password verified! Enter new password.</div>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <div style={{ display: "flex", alignItems: "center" }}>
                                                <input
                                                    id="profile-password-new"
                                                    type={newPasswordVisible ? "text" : "password"}
                                                    name="newPassword"
                                                    value={editFieldValue}
                                                    onChange={handleEditFieldChange}
                                                    className="ordersetu-profile-input"
                                                    placeholder="Enter new password"
                                                    autoFocus
                                                />
                                                <span
                                                    style={{ cursor: "pointer", marginLeft: 8 }}
                                                    onClick={() => setNewPasswordVisible(v => !v)}
                                                    tabIndex={0}
                                                    aria-label="Toggle password visibility"
                                                >
                                                    {newPasswordVisible ? "👁️" : "🙈"}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                className="ordersetu-profile-edit-confirm"
                                                onClick={handleConfirmEditField}
                                                disabled={loading || !editFieldValue}
                                            >✔️</button>
                                            <button
                                                type="button"
                                                className="ordersetu-profile-edit-cancel"
                                                onClick={handleCancelEditField}
                                                disabled={loading}
                                            >✖️</button>
                                        </>
                                    )
                                ) : (
                                    <>
                                        <input
                                            id={`profile-${field.key}`}
                                            type={field.type}
                                            name={field.key}
                                            value={editFieldValue}
                                            onChange={handleEditFieldChange}
                                            className="ordersetu-profile-input"
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            className="ordersetu-profile-edit-confirm"
                                            onClick={handleConfirmEditField}
                                            disabled={loading}
                                        >✔️</button>
                                        <button
                                            type="button"
                                            className="ordersetu-profile-edit-cancel"
                                            onClick={handleCancelEditField}
                                            disabled={loading}
                                        >✖️</button>
                                    </>
                                )
                            ) : (
                                <>
                                    <span className="ordersetu-profile-value">
                                        {field.key === "password" ? "********" : form[field.key]}
                                    </span>
                                    <button
                                        type="button"
                                        className="ordersetu-profile-edit-btn"
                                        onClick={() => handleEditField(field.key)}
                                        tabIndex={0}
                                        aria-label={`Edit ${field.label}`}
                                    >✎</button>
                                </>
                            )}
                        </div>
                    ))}
                    {error && <div className="ordersetu-profile-error">{error}</div>}
                    {success && <div className="ordersetu-profile-success">{success}</div>}
                    <button
                        type="submit"
                        className="ordersetu-profile-submit"
                        disabled={loading}
                    >
                        {loading ? "Saving..." : "Save"}
                    </button>
                </form>
            </div>
        </div>
    );
};

// Export two wrappers for clarity
export const EditOwnerProfile = (props) => <EditProfile {...props} mode="owner" />;
export const EditWorkerProfile = (props) => <EditProfile {...props} mode="worker" />;

export default EditProfile;
