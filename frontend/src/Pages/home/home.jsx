import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../../components/footer/footer";
import "./home.css";

const Home = () => {
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        restaurants: 0,
        users: 0,
        orders: 0,
        items: 0
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const backendUrl =
                    import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

                const res = await fetch(`${backendUrl}/ordersetu-stats`);
                const data = await res.json();

                setStats({
                    restaurants: data.restaurants || 0,
                    users: data.users || 0,
                    orders: data.orders || 0,
                    items: data.items || 0
                });
            } catch (error) {
                console.error("Failed to fetch OrderSetu stats", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="ordersetu-home">
            {/* HERO */}
            <section className="hero">
                <div className="hero-content">
                    <img
                        src="/OrderSetu_logo.png"
                        alt="OrderSetu Logo"
                        className="hero-logo"
                    />
                    <h1>OrderSetu</h1>
                    <div className="ai-badge" title="AI Powered">
                        <span role="img" aria-label="AI">🤖</span> AI Integrated
                    </div>
                    <p className="hero-tagline">
                        Smart Restaurant Ordering & Management Platform<br />
                        <span className="ai-highlight">Now with AI-powered features for smarter, faster service!</span>
                    </p>

                    <div className="hero-actions">
                        <button onClick={() => navigate("/login")}>Login</button>
                        <button
                            className="primary"
                            onClick={() => navigate("/customer")}
                        >
                            Place Order
                        </button>
                    </div>
                </div>

                <img
                    src="/OrderSetu_brand_banner.png"
                    alt="OrderSetu Banner"
                    className="hero-image"
                />
            </section>

            {/* STATS */}
            <section className="stats">
                {loading ? (
                    <p className="stats-loading">Loading stats...</p>
                ) : (
                    <div className="stats-grid">
                        <div className="stat-card">
                            <h2>{stats.restaurants}</h2>
                            <p>Restaurants</p>
                        </div>

                        <div className="stat-card">
                            <h2>{stats.users}</h2>
                            <p>Users</p>
                        </div>

                        <div className="stat-card">
                            <h2>{stats.orders}</h2>
                            <p>Orders Placed</p>
                        </div>

                        <div className="stat-card">
                            <h2>{stats.items}</h2>
                            <p>Items Listed</p>
                        </div>
                    </div>
                )}
            </section>

            {/* WORKFLOW */}
            <section className="workflow">
                <h2>How OrderSetu Works</h2>

                <div className="workflow-grid">
                    <div className="step">
                        <span>1</span>
                        <h3>Customer Orders</h3>
                        <p>Select restaurant, table, browse menu and place order.</p>
                    </div>

                    <div className="step">
                        <span>2</span>
                        <h3>Kitchen & Staff</h3>
                        <p>Orders reach chef and waiter instantly.</p>
                    </div>

                    <div className="step">
                        <span>3</span>
                        <h3>Owner Control</h3>
                        <p>Manage menu, pricing, staff & orders.</p>
                    </div>

                    <div className="step">
                        <span>4</span>
                        <h3>Billing & Payment</h3>
                        <p>Auto billing, payment tracking & notifications.</p>
                    </div>
                </div>
            </section>

            {/* AUDIENCE */}
            <section className="audience">
                <h2>Built For Everyone</h2>

                <div className="audience-grid">
                    <div>👤 Customers – Fast ordering</div>
                    <div>👨‍🍳 Staff – Clear workflow</div>
                    <div>🏪 Owners – Full control</div>
                </div>
            </section>

            {/* CTA */}
            <section className="cta">
                <h2>Ready to digitize your restaurant?</h2>
                <button onClick={() => navigate("/register")}>
                    Get Started with OrderSetu
                </button>
            </section>

            <Footer />
        </div>
    );
};

export default Home;