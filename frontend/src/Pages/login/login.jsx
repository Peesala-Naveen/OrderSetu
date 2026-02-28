import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";


const logoUrl = "/OrderSetu_brand_banner.png";

const Login = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        email: "",
        password: "",
        role: "Owner",
    });
    const [error, setError] = useState(""); // Add error state
    const [showPassword, setShowPassword] = useState(false); // <-- NEW

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
            const frontendUrl = import.meta.env.VITE_FRONTEND_URL || "http://localhost:5173";
            // Only send email and password
            const response = await fetch(`${backendUrl}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: form.email,
                    password: form.password
                }),
                credentials: "include", // if using cookies/session
            });
            if (response.ok) {
                let data = {};
                try {
                    data = await response.json();
                } catch (jsonErr) {
                    setError("Invalid server response");
                    return;
                }
                // Store token in localStorage
                if (data.token) {
                    localStorage.setItem("token", data.token);
                }
                if (data.userId) {
                    localStorage.setItem("user_id", data.userId);
                }
                // Use userType from backend if present, else fallback to form.role
                let userType = data.userType || data.type || form.role;
                if (userType.toLowerCase() === "owner") {
                    window.location.href = `${frontendUrl}/owner`;
                } else if (userType.toLowerCase() === "server" || userType.toLowerCase() === "chef") {
                    window.location.href = `${frontendUrl}/chef`;
                } else if (userType.toLowerCase() === "waiter") {
                    window.location.href = `${frontendUrl}/waiter`;
                } else {
                    navigate("/"); // Default fallback
                }
            } else {
                let errMsg = "Login failed";
                try {
                    const err = await response.json();
                    errMsg = err.message || errMsg;
                } catch {
                    // If not JSON, keep default message

                }
                setError(errMsg);
            }
        } catch (err) {
            console.error("Login error:", err);
            setError("Network error");
        }
    };

    return (
        <div className="login-container">
            <div className="brand-header">
                <img src={logoUrl} alt="OrderSetu Logo" className="brand-logo" />
                <span className="brand-name">OrderSetu</span>
            </div>
            <div className="login-box">
                <h2 className="login-title">Login</h2>
                {error && <div className="login-error">{error}</div>}
                <form onSubmit={handleSubmit} className="login-form">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        autoComplete="username"
                    />

                    <label htmlFor="password">Password</label>
                    <div className="login-password-wrapper">
                        <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            required
                            autoComplete="current-password"
                            className="login-password-input"
                        />
                        <span
                            className="login-password-eye"
                            onClick={() => setShowPassword((v) => !v)}
                            tabIndex={0}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            role="button"
                        >
                            {showPassword ? "🙈" : "👁️"}
                        </span>
                    </div>

                    <button type="submit" className="login-btn">Login</button>
                </form>
                <span className="forgot-password">Forgot password?</span>
                <p className="register-text">
                    Create an account? <span className="register-link" onClick={() => navigate('/register')}>Register</span>
                </p>
            </div>
        </div>
    );
};

export default Login;
