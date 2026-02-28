import "./navbar.css";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AddItemToMenu from "../addAndEditMenu/addItemToMenu";
import EditMenu from "../addAndEditMenu/editMenu";
import { EditOwnerProfile, EditWorkerProfile } from "../editProfile/editProfile";
import JoinRequest from "../JoinRequest/JoinRequest";
import EditTables from "../editNoOfTables/editTables";
import EditCharges from "../editCharges/editCharges"; // <-- Add this import
import EditWorker from "../editWorkers/editWorker"; // <-- Add this import

const Navbar = ({
    dashboardTitle = "User Dashboard",
    mode = "dashboard",
    cartItems = [],
    onCartQuantityChange,
    onRemoveFromCart,
    onCategoryChange,
    selectedCategory: propSelectedCategory, // Rename prop to avoid conflict
    searchTerm,
    onSearchChange,
    onGenerateBill,
    onMenuItemsChange,
    onTableOptionsChange,
    onShowCart,
    onRestaurantChange,
    onTableChange,
    onChargesChange,
}) => {

    const [showEditDropdown, setShowEditDropdown] = useState(false);
    const [showCart, setShowCart] = useState(false);
    const [showJoinRequests, setShowJoinRequests] = useState(false);

    const editDropdownRef = useRef(null);
    const cartDropdownRef = useRef(null);

    const [showOwnerProfileEdit, setShowOwnerProfileEdit] = useState(false);
    const [showWorkerProfileEdit, setShowWorkerProfileEdit] = useState(false);
    const [userType, setUserType] = useState("");


    const [restaurantName, setRestaurantName] = useState("OrderSetu");
    const [showMenuSubOptions, setShowMenuSubOptions] = useState(false);
    const menuSubOptionsRef = useRef(null);
    const navigate = useNavigate();
    // Close submenu when clicking outside
    useEffect(() => {
        if (!showMenuSubOptions) return;
        function handleClickOutside(event) {
            if (
                menuSubOptionsRef.current &&
                !menuSubOptionsRef.current.contains(event.target)
            ) {
                setShowMenuSubOptions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showMenuSubOptions]);

    useEffect(() => {
        const fetchRestaurantName = async () => {
            if (mode === "owner" || mode === "chef" || mode === "waiter") { // <-- include all worker roles
                const token = localStorage.getItem("token");
                if (!token) {
                    setRestaurantName("OrderSetu");
                    return;
                }
                try {
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
                        if (mode === "owner") {
                            const name = (data.user && data.user.restaurantName) || data.restaurantName || "OrderSetu";
                            setRestaurantName(name);
                        } else if (data.user && (data.user.restaurant_id || data.user.restaurantId)) {
                            const restaurantId = data.user.restaurant_id || data.user.restaurantId;
                            try {
                                const res2 = await fetch(`${backendUrl}/restaurant-options`);
                                if (res2.ok) {
                                    const options = await res2.json();
                                    const found = options.find(r =>
                                        String(r.id) === String(restaurantId)
                                    );
                                    setRestaurantName((found && found.name) || "OrderSetu");
                                } else {
                                    setRestaurantName("OrderSetu");
                                }
                            } catch {
                                setRestaurantName("OrderSetu");
                            }
                        } else {
                            setRestaurantName("OrderSetu");
                        }
                    } else if (res.status === 401) {
                        // Token invalid/expired, force logout
                        localStorage.removeItem("token");
                        window.location.href = "/login";
                    }
                } catch {
                    setRestaurantName("OrderSetu");
                }
            }
        };
        fetchRestaurantName();
    }, [mode]);

    const handleProfileIconClick = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setShowOwnerProfileEdit(false);
            setShowWorkerProfileEdit(false);
            setUserType("");
            return;
        }
        try {
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
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!res.ok) {
                localStorage.removeItem("token");
                setShowOwnerProfileEdit(false);
                setShowWorkerProfileEdit(false);
                setUserType("");
                return;
            }

            const data = await res.json();
            const user = data.user || {};
            const type = user.type || user.role || "";

            setUserType(type);

            if (type === "owner") {
                setShowOwnerProfileEdit(true);
            } else {
                setShowWorkerProfileEdit(true);
            }
        } catch {
            setShowOwnerProfileEdit(false);
            setShowWorkerProfileEdit(false);
            setUserType("");
        }
    };

    const handleEditClick = () => {
        setShowEditDropdown(!showEditDropdown);
    };

    const getDropdownOptions = () => {
        if (mode === "owner") {
            return [
                { label: "🪑 Tables", value: "tables" },
                { label: "📋 Menu", value: "menu" },
                { label: "💰 Charges", value: "charges" },
                { label: "👥 Workers", value: "workers" },
                { label: "👥 Join Requests", value: "join-requests" }
            ];
        } else if (mode === "chef") {
            return [
                { label: "📋 Menu", value: "menu" }
            ];
        }
        return [];
    };

    const handleDropdownOptionClick = (option) => {
        if (option.value === "menu") {
            setShowMenuSubOptions(true);
        } else if (option.value === "tables") {
            setShowEditTablesPopup(true);
        } else if (option.value === "charges") {
            setShowEditChargesPopup(true); // <-- Open charges popup
        } else if (option.value === "join-requests") {
            setShowJoinRequestsPopup(true); // <-- Show JoinRequest popup
        } else if (option.value === "workers") {
            setShowEditWorkerPopup(true); // <-- Show EditWorker popup
        }
        setShowEditDropdown(false);
    };

    const handleAddMenuItem = () => {
        setShowMenuSubOptions(false);
        setShowAddMenuPopup(true);
    };

    const handleEditMenu = () => {
        setShowMenuSubOptions(false);
        setShowEditMenuPopup(true);
    };

    const [showAddMenuPopup, setShowAddMenuPopup] = useState(false);
    const [showEditMenuPopup, setShowEditMenuPopup] = useState(false);
    const [showEditTablesPopup, setShowEditTablesPopup] = useState(false);
    const [showEditChargesPopup, setShowEditChargesPopup] = useState(false);
    const [showJoinRequestsPopup, setShowJoinRequestsPopup] = useState(false);
    const [showEditWorkerPopup, setShowEditWorkerPopup] = useState(false);

    // Customer selectors state
    const [restaurantOptions, setRestaurantOptions] = useState([]);
    const [selectedRestaurant, setSelectedRestaurant] = useState("");

    const [tableOptions, setTableOptions] = useState([]);
    const [selectedTable, setSelectedTable] = useState("");
    // Cart badge: sum of all quantities in cart
    const getCartQuantitySum = (items) => {
        if (!Array.isArray(items)) return 0;
        return items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    };
    const [cartCount, setCartCount] = useState(getCartQuantitySum(cartItems));

    useEffect(() => {
        if (mode !== "customer") return;

        const savedRestaurant =
            localStorage.getItem("ordersetu_selected_restaurant_id");
        const savedTable =
            localStorage.getItem("ordersetu_selected_table_number");

        if (savedRestaurant) {
            setSelectedRestaurant(savedRestaurant);

            // notify parent (customer.jsx)
            if (typeof onRestaurantChange === "function") {
                onRestaurantChange(savedRestaurant);
            }
        }

        if (savedTable) {
            setSelectedTable(savedTable);

            if (typeof onTableChange === "function") {
                onTableChange(savedTable);
            }
        }
    }, [mode]);
    // Update cartCount when cartItems prop changes
    useEffect(() => {
        setCartCount(getCartQuantitySum(cartItems));
    }, [cartItems]);

    useEffect(() => {
        if (mode === "customer") {
            // Fetch restaurant options
            const fetchRestaurants = async () => {
                try {
                    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
                    const res = await fetch(`${backendUrl}/restaurant-options`);
                    if (res.ok) {
                        const data = await res.json();
                        setRestaurantOptions(data);
                    }
                } catch {
                    setRestaurantOptions([]);
                }
            };
            fetchRestaurants();
        }
    }, [mode]);

    useEffect(() => {
        if (mode === "customer" && selectedRestaurant) {
            const fetchDetailsAndMenu = async () => {
                try {
                    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
                    // Fetch restaurant details for noOfTables
                    let tablesArray = [];
                    let numTables = 0;
                    let serviceCharges = 0;
                    let gst = 0;
                    const resDetails = await fetch(`${backendUrl}/restaurant-details/${selectedRestaurant}`);
                    if (resDetails.ok) {
                        let details = {};
                        try {
                            details = await resDetails.json();
                        } catch {
                            details = {};
                        }
                        // Defensive: ensure details is an object and noOfTables is a number
                        numTables = Number(details.noOfTables ?? details.table ?? details.tables ?? 0);
                        serviceCharges = Number(details.serviceCharges || 0);
                        gst = Number(details.gst || 0);
                    }
                    tablesArray = numTables > 0 ? Array.from({ length: numTables }, (_, i) => i + 1) : [];
                    setTableOptions(tablesArray);
                    onChargesChange?.({
                        serviceCharges,
                        gst
                    });
                    if (onTableOptionsChange) onTableOptionsChange(tablesArray);

                    // Fetch menu items (no auth required)
                    const resMenu = await fetch(`${backendUrl}/get-menu/${selectedRestaurant}`);
                    if (resMenu.ok) {
                        const menuData = await resMenu.json();
                        onMenuItemsChange?.(menuData.items || []);
                    } else {
                        onMenuItemsChange?.([]);
                    }
                } catch (error) {
                    setTableOptions([]);
                    if (onTableOptionsChange) onTableOptionsChange([]);
                    onMenuItemsChange?.([]);
                }
            };
            fetchDetailsAndMenu();
        }
    }, [selectedRestaurant, mode, restaurantOptions]);

    return (
        <nav className="navbar">

            {showOwnerProfileEdit && userType === "owner" && (
                <EditOwnerProfile onClose={() => setShowOwnerProfileEdit(false)} />
            )}

            {showWorkerProfileEdit && (userType === "chef" || userType === "waiter") && (
                <EditWorkerProfile onClose={() => setShowWorkerProfileEdit(false)} />
            )}

            {showAddMenuPopup && (
                <AddItemToMenu onClose={() => setShowAddMenuPopup(false)} />
            )}
            {showEditMenuPopup && (
                <EditMenu onClose={() => setShowEditMenuPopup(false)} />
            )}
            {showEditTablesPopup && (
                <EditTables onClose={() => setShowEditTablesPopup(false)} />
            )}
            {showEditChargesPopup && (
                <EditCharges onClose={() => setShowEditChargesPopup(false)} />
            )}
            {showJoinRequestsPopup && (
                <JoinRequest onClose={() => setShowJoinRequestsPopup(false)} />
            )}
            {showEditWorkerPopup && (
                <EditWorker onClose={() => setShowEditWorkerPopup(false)} />
            )}

            <div className={`nav-content ${mode === "customer" ? "customer-layout" : ""}`}>
                <div
                    className="brand_area brand_area--clickable"
                    onClick={() => navigate("/")}
                    tabIndex={0}
                    role="button"
                    aria-label="Go to home page"
                >
                    <img className="brand-logo" src="/OrderSetu_logo.png" alt="OrderSetu logo" />
                    <span className="brand-name">OrderSetu</span>
                </div>
                {mode === "owner" ? (
                    <>
                        <div className="dashboard dashboard--center">
                            {restaurantName} - Owner Page
                        </div>
                        <div className="nav-actions">
                            <div className="edit-dropdown-container" ref={editDropdownRef}>
                                <button
                                    className={`icon edit-icon-btn ${showEditDropdown ? "active" : ""}`}
                                    aria-label="Edit menu"
                                    onClick={handleEditClick}
                                    title="Edit Options"
                                >
                                    ✎
                                </button>
                                {showEditDropdown && (
                                    <div className="edit-dropdown-menu">
                                        {getDropdownOptions().map((option) => (
                                            <button
                                                key={option.value}
                                                className="dropdown-option"
                                                onClick={() => handleDropdownOptionClick(option)}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {showMenuSubOptions && (
                                    <div className="ordersetu-themed-submenu" ref={menuSubOptionsRef}>
                                        <button className="ordersetu-submenu-btn" onClick={handleAddMenuItem}>
                                            ➕ Add Item to Menu
                                        </button>
                                        <button className="ordersetu-submenu-btn" onClick={handleEditMenu}>
                                            ✎ Edit Menu
                                        </button>
                                    </div>
                                )}
                            </div>
                            <span
                                className="icon profile-icon"
                                aria-label="Profile"
                                title="Profile"
                                onClick={handleProfileIconClick}
                                style={{ cursor: "pointer" }}
                            >👤</span>
                        </div>
                    </>
                ) : mode === "chef" ? (
                    <>
                        <div className="dashboard dashboard--center">
                            {restaurantName} - Chef Dashboard
                        </div>
                        <div className="nav-actions">
                            <div className="edit-dropdown-container" ref={editDropdownRef}>
                                <button
                                    className={`icon edit-icon-btn ${showEditDropdown ? "active" : ""}`}
                                    aria-label="Edit menu"
                                    onClick={handleEditClick}
                                    title="Edit Options"
                                >
                                    ✎
                                </button>
                                {showEditDropdown && (
                                    <div className="edit-dropdown-menu">
                                        {getDropdownOptions().map((option) => (
                                            <button
                                                key={option.value}
                                                className="dropdown-option"
                                                onClick={() => handleDropdownOptionClick(option)}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {showMenuSubOptions && (
                                    <div className="ordersetu-themed-submenu" ref={menuSubOptionsRef}>
                                        <button className="ordersetu-submenu-btn" onClick={handleAddMenuItem}>
                                            ➕ Add Item to Menu
                                        </button>
                                        <button className="ordersetu-submenu-btn" onClick={handleEditMenu}>
                                            ✎ Edit Menu
                                        </button>
                                    </div>
                                )}
                            </div>
                            <span
                                className="icon profile-icon"
                                aria-label="Profile"
                                title="Profile"
                                onClick={handleProfileIconClick}
                                style={{ cursor: "pointer" }}
                            >👤</span>
                        </div>
                    </>
                ) : mode === "waiter" ? (
                    <>
                        <div className="dashboard dashboard--center">
                            {restaurantName} - Waiter Dashboard
                        </div>
                        <div className="nav-actions">
                            <span
                                className="icon profile-icon"
                                aria-label="Profile"
                                title="Profile"
                                onClick={handleProfileIconClick}
                                style={{ cursor: "pointer" }}
                            >👤</span>
                        </div>
                    </>
                ) : mode === "customer" ? (
                    <>
                        <div className="dashboard">
                            {dashboardTitle}
                        </div>
                        <div className="customer-selectors">
                            <select
                                className="customer-restaurant-selector"
                                value={selectedRestaurant || ""}
                                onChange={e => {
                                    const selectedObjectId = e.target.value;
                                    setSelectedRestaurant(selectedObjectId);
                                    setSelectedTable("");
                                    // ✅ STORE REAL OBJECTID
                                    localStorage.setItem(
                                        "ordersetu_selected_restaurant_id",
                                        selectedObjectId
                                    );


                                    onRestaurantChange(selectedObjectId);

                                }}
                            >
                                <option value="">Select Restaurant</option>
                                {restaurantOptions.map(r => (
                                    <option key={r._id} value={r._id}>
                                        {r.label}
                                    </option>
                                ))}
                            </select>
                            <select
                                className="customer-table-selector"
                                value={selectedTable || ""}
                                onChange={e => {
                                    setSelectedTable(e.target.value);
                                    // Store table number
                                    localStorage.setItem(
                                        "ordersetu_selected_table_number",
                                        e.target.value
                                    );
                                    if (typeof onTableChange === "function") {
                                        onTableChange(e.target.value);
                                    }
                                }}
                                disabled={!selectedRestaurant}
                            >
                                <option value="">Select Table</option>
                                {tableOptions.map(num => (
                                    <option key={num} value={num}>
                                        {`Table ${num}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="nav-actions">
                            <span
                                className="icon cart-icon"
                                aria-label="Cart"
                                title="Cart"
                                onClick={onShowCart}
                            >
                                🛒
                                {cartCount > 0 && (
                                    <span className="cart-badge">{cartCount}</span>
                                )}
                            </span>
                        </div>
                    </>
                ) : null}
            </div>
        </nav>

    );
};

export default Navbar;
