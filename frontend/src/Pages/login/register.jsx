import React, { useState, useEffect } from "react";
import "./register.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const ownerInitial = {
    restaurantId: "",
    restaurantName: "",
    ownerName: "",
    type: "owner",
    mobileNumber: "",
    email: "",
    address: "",
    password: "",
    confirmPassword: "",
    roles: ["chef", "waiter", "cleaner"],
    table: 1,
    serviceCharges: 0,
    gst: 0,
};

const otherInitial = {
    restaurant_id: "",
    name: "",
    mobileNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
    salary: "",
    type: "",
};

const Register = () => {
    const [userType, setUserType] = useState(""); // "owner" or "other"
    const [form, setForm] = useState(ownerInitial);
    const [restaurantOptions, setRestaurantOptions] = useState([]);
    const [roleOptions, setRoleOptions] = useState([]);
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [popupMsg, setPopupMsg] = useState(""); // NEW

    useEffect(() => {
        if (userType === "other") {
            axios.get(`${BACKEND_URL}/restaurant-options`)
                .then(res => setRestaurantOptions(res.data))
                .catch(() => setRestaurantOptions([]));
        }
    }, [userType]);

    useEffect(() => {
        if (userType === "other" && form.restaurant_id) {
            axios.get(`${BACKEND_URL}/restaurant-roles/${form.restaurant_id}`)
                .then(res => setRoleOptions(res.data.roles || []))
                .catch(() => setRoleOptions([]));
        } else {
            setRoleOptions([]);
        }
    }, [form.restaurant_id, userType]);

    const handleTypeSelect = (type) => {
        setUserType(type);
        setForm(type === "owner" ? ownerInitial : otherInitial);
        setRoleOptions([]);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password !== form.confirmPassword) {
            setPopupMsg("Passwords do not match.");
            return;
        }
        if (userType === "other" && !form.restaurant_id) {
            setPopupMsg("Please select a Restaurant ID.");
            return;
        }
        try {
            let payload;
            if (userType === "owner") {
                payload = {
                    restaurantId: form.restaurantId,
                    restaurantName: form.restaurantName,
                    ownerName: form.ownerName,
                    type: "owner",
                    mobileNumber: form.mobileNumber,
                    email: form.email,
                    address: form.address,
                    password: form.password,
                    roles: form.roles,
                    table: form.table,
                    serviceCharges: form.serviceCharges,
                    gst: form.gst,
                };
            } else {
                payload = {
                    restaurantId: form.restaurant_id,
                    name: form.name,
                    mobileNumber: form.mobileNumber,
                    email: form.email,
                    password: form.password,
                    salary: form.salary,
                    type: form.type,
                };
            }
            await axios.post(`${BACKEND_URL}/signup`, payload);
            setPopupMsg("Registration request submitted! Await approval.");
            setTimeout(() => {
                setPopupMsg("");
                navigate("/login");
            }, 2000);
        } catch (err) {
            setPopupMsg(
                err?.response?.data?.message ||
                "Registration failed. Please check your details and try again."
            );
        }
    };

    return (
        <div className="register-container">
            {/* Popup message */}
            {popupMsg && (
                <div className="register-popup-msg">
                    {popupMsg}
                    <button className="register-popup-close" onClick={() => setPopupMsg("")}>×</button>
                </div>
            )}
            <div className="register-box">
                <h2 className="register-title">OrderSetu Welcomes You! Please Join our Family</h2>
                {!userType && (
                    <div className="register-type-select">
                        <button type="button" onClick={() => handleTypeSelect("owner")}>Owner</button>
                        <button type="button" onClick={() => handleTypeSelect("other")}>Other</button>
                    </div>
                )}

                {userType === "owner" && (
                    <form onSubmit={handleSubmit} className="register-form">
                        <label htmlFor="restaurantId">Restaurant ID</label>
                        <input
                            type="text"
                            id="restaurantId"
                            name="restaurantId"
                            value={form.restaurantId}
                            onChange={handleChange}
                            required
                        />

                        <label htmlFor="restaurantName">Restaurant Name</label>
                        <input
                            type="text"
                            id="restaurantName"
                            name="restaurantName"
                            value={form.restaurantName}
                            onChange={handleChange}
                            required
                        />

                        <label htmlFor="ownerName">Owner Name</label>
                        <input
                            type="text"
                            id="ownerName"
                            name="ownerName"
                            value={form.ownerName}
                            onChange={handleChange}
                            required
                        />

                        <label htmlFor="mobileNumber">Mobile Number</label>
                        <input
                            type="tel"
                            id="mobileNumber"
                            name="mobileNumber"
                            value={form.mobileNumber}
                            onChange={handleChange}
                            required
                            pattern="[0-9]{10}"
                            maxLength={10}
                        />

                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                        />

                        <label htmlFor="address">Address</label>
                        <input
                            type="text"
                            id="address"
                            name="address"
                            value={form.address}
                            onChange={handleChange}
                        />

                        <label htmlFor="password">Password</label>
                        <div className="register-password-wrapper">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                required
                                className="register-password-input"
                            />
                            <span
                                className="register-password-eye"
                                onClick={() => setShowPassword((v) => !v)}
                                tabIndex={0}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                role="button"
                            >
                                {showPassword ? "🙈" : "👁️"}
                            </span>
                        </div>

                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <div className="register-password-wrapper">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                id="confirmPassword"
                                name="confirmPassword"
                                value={form.confirmPassword}
                                onChange={handleChange}
                                required
                                className="register-password-input"
                            />
                            <span
                                className="register-password-eye"
                                onClick={() => setShowConfirmPassword((v) => !v)}
                                tabIndex={0}
                                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                role="button"
                            >
                                {showConfirmPassword ? "🙈" : "👁️"}
                            </span>
                        </div>

                        <label htmlFor="table">No. of Tables</label>
                        <input
                            type="number"
                            id="table"
                            name="table"
                            value={form.table}
                            onChange={handleChange}
                            min={1}
                            required
                        />

                        <label htmlFor="serviceCharges">Service Charges</label>
                        <input
                            type="number"
                            id="serviceCharges"
                            name="serviceCharges"
                            value={form.serviceCharges}
                            onChange={handleChange}
                            min={0}
                            required
                        />

                        <label htmlFor="gst">GST</label>
                        <input
                            type="number"
                            id="gst"
                            name="gst"
                            value={form.gst}
                            onChange={handleChange}
                            min={0}
                            required
                        />

                        <p style={{ textAlign: "center", margin: "0 0 1rem 0", color: "#fff" }}>
                            Already have an account?{" "}
                            <span
                                style={{ color: "#ff5f1f", cursor: "pointer", fontWeight: 600 }}
                                onClick={() => navigate("/login")}
                            >Login</span>
                        </p>
                        <button type="submit" className="register-btn">Register</button>
                    </form>
                )}

                {userType === "other" && (
                    <form onSubmit={handleSubmit} className="register-form">
                        <label htmlFor="restaurant_id">Restaurant ID</label>
                        <select
                            name="restaurant_id"
                            value={form.restaurant_id}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select Restaurant</option>

                            {restaurantOptions.map(r => (
                                <option key={r._id} value={r.restaurantId}>
                                    {r.label}
                                </option>
                            ))}
                        </select>

                        <label htmlFor="name">Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            required
                        />

                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                        />

                        <label htmlFor="password">Password</label>
                        <div className="register-password-wrapper">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                required
                                className="register-password-input"
                            />
                            <span
                                className="register-password-eye"
                                onClick={() => setShowPassword((v) => !v)}
                                tabIndex={0}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                role="button"
                            >
                                {showPassword ? "🙈" : "👁️"}
                            </span>
                        </div>

                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <div className="register-password-wrapper">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                id="confirmPassword"
                                name="confirmPassword"
                                value={form.confirmPassword}
                                onChange={handleChange}
                                required
                                className="register-password-input"
                            />
                            <span
                                className="register-password-eye"
                                onClick={() => setShowConfirmPassword((v) => !v)}
                                tabIndex={0}
                                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                role="button"
                            >
                                {showConfirmPassword ? "🙈" : "👁️"}
                            </span>
                        </div>

                        <label htmlFor="mobileNumber">Mobile Number</label>
                        <input
                            type="tel"
                            id="mobileNumber"
                            name="mobileNumber"
                            value={form.mobileNumber}
                            onChange={handleChange}
                            required
                            pattern="[0-9]{10}"
                            maxLength={10}
                        />

                        <label htmlFor="salary">Salary</label>
                        <input
                            type="number"
                            id="salary"
                            name="salary"
                            value={form.salary}
                            onChange={handleChange}
                            required
                        />

                        <label htmlFor="type">Role</label>
                        <select
                            id="type"
                            name="type"
                            value={form.type}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select Role</option>
                            {roleOptions.map(role => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>

                        <p style={{ textAlign: "center", margin: "0 0 1rem 0", color: "#fff" }}>
                            Already have an account?{" "}
                            <span
                                style={{ color: "#ff5f1f", cursor: "pointer", fontWeight: 600 }}
                                onClick={() => navigate("/login")}
                            >Login</span>
                        </p>
                        <button type="submit" className="register-btn">Register</button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Register;
