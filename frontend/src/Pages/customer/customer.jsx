import React, { useState, useEffect, useRef } from "react";
import Navbar from "../../components/navbar/navbar";
import Card from "../../components/card/card";
import Bill from "../../components/bill/bill";
import "./customer.css";

// OrderSetu Popup Component
const OrderSetuPopup = ({ message, onClose }) => (
    <div className="ordersetu-popup-overlay">
        <div className="ordersetu-popup-box">
            <div className="ordersetu-popup-message">{message}</div>
            <button className="ordersetu-popup-close-btn" onClick={onClose}>OK</button>
        </div>
    </div>
);

const Customer = () => {
    // Cart state is only for triggering re-render, source of truth is localStorage
    const [cart, setCart] = useState([]);
    const [showCartPopup, setShowCartPopup] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [showBill, setShowBill] = useState(
        localStorage.getItem("ordersetu_show_bill") === "true"
    );
    const [orderConfirmed, setOrderConfirmed] = useState(
        localStorage.getItem("ordersetu_order_confirmed") === "true"
    );

    // NEW: State for menu items, table options, restaurant, and table selection
    const [menuItems, setMenuItems] = useState([]);
    const [tableOptions, setTableOptions] = useState([]);
    const [selectedRestaurant, setSelectedRestaurant] = useState(
        localStorage.getItem("ordersetu_selected_restaurant_id") || ""
    );
    const [selectedTable, setSelectedTable] = useState(
        localStorage.getItem("ordersetu_selected_table_number") || ""
    );

    //for the charges
    const [serviceCharges, setServiceCharges] = useState(0);
    const [gst, setGst] = useState(0);

    // WebSocket reference get Notifications:
    const socketRef = useRef(null);
    const [confirmedOrderId, setConfirmedOrderId] = useState(
        localStorage.getItem("ordersetu_confirmed_order_id")
    );
    // Popup state
    const [popupMessage, setPopupMessage] = useState("");
    const showPopup = (msg) => setPopupMessage(msg);
    const closePopup = () => setPopupMessage("");
    // Helper to get cart from localStorage
    const getCartFromStorage = () => {
        try {
            const cart = JSON.parse(localStorage.getItem("ordersetu_cart"));
            return Array.isArray(cart) ? cart : [];
        } catch {
            return [];
        }
    };

    // Helper to save cart to localStorage
    const saveCartToStorage = (cartArr) => {
        localStorage.setItem("ordersetu_cart", JSON.stringify(cartArr));
    };



    useEffect(() => {
        const confirmed = localStorage.getItem("ordersetu_order_confirmed") === "true";
        const billVisible = localStorage.getItem("ordersetu_show_bill") === "true";

        if (confirmed) setOrderConfirmed(true);
        if (billVisible) setShowBill(true);
    }, []);
    // Sync cart state with localStorage
    useEffect(() => {
        setCart(getCartFromStorage());
    }, []);

    // WebSocket setup for receiving notifications and updating cart based on waiter updates
    useEffect(() => {
        if (!confirmedOrderId) return;

        const socket = new WebSocket(import.meta.env.VITE_WS_URL || "ws://localhost:5000");

        socket.onopen = () => {
            socket.send(JSON.stringify({
                type: "JOIN_CUSTOMER",
                confirmedOrderId
            }));
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === "ORDER_UPDATED") {
                const updates = data.updates;

                let cart = JSON.parse(localStorage.getItem("cart")) || [];

                updates.forEach(u => {
                    if (u.action === "removed") {
                        cart = cart.filter(i => i.name !== u.itemName);
                    } else if (u.action === "updated") {
                        const item = cart.find(i => i.name === u.itemName);
                        if (item) item.quantity = u.newQty;
                    }
                });

                localStorage.setItem("cart", JSON.stringify(cart));
                setCart(cart); // your cart state

                alert(
                    updates
                        .map(u =>
                            u.action === "removed"
                                ? `${u.itemName} was removed`
                                : `${u.itemName} quantity changed to ${u.newQty}`
                        )
                        .join("\n")
                );
            }
        };

        return () => socket.close();
    }, [confirmedOrderId]);
    //when the notification is recieved from the owner using websocket, the customer will get an alert and the cart will be cleared    
    useEffect(() => {
        if (!confirmedOrderId) return;

        const backendUrl =
            import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

        const wsUrl = backendUrl.replace(/^http/, "ws");

        const socket = new WebSocket(wsUrl);
        socketRef.current = socket;

        socket.onopen = () => {
            socket.send(
                JSON.stringify({
                    type: "JOIN_CUSTOMER",
                    confirmedOrderId
                })
            );
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === "PAYMENT_ACCEPTED") {
                showPopup(data.message);


                localStorage.removeItem("ordersetu_cart");
                localStorage.removeItem("ordersetu_confirmed_order_id");
                localStorage.removeItem("ordersetu_order_confirmed");
                localStorage.removeItem("ordersetu_show_bill");

                setCart([]);
                setConfirmedOrderId(null);

                setShowBill(false);
                setShowCartPopup(false);
            }
            if (data.type === "PAYMENT_REJECTED") {
                showPopup(data.message);
                // Keep cart & confirmed order
                localStorage.removeItem("ordersetu_show_bill");

                setShowBill(false);
            }
            if (data.type === "ORDER_UPDATED") {
                const updates = data.updates || [];

                let cart = getCartFromStorage();
                let messages = [];

                updates.forEach(({ itemName, oldQty, newQty }) => {
                    const idx = cart.findIndex(i => i.name === itemName);

                    if (newQty === 0 && idx !== -1) {
                        cart.splice(idx, 1);
                        messages.push(`❌ ${itemName} was removed`);
                    }

                    if (idx !== -1 && newQty > 0) {
                        cart[idx].quantity = newQty;
                        cart[idx].totalPrice = newQty * cart[idx].price;
                        messages.push(`🔄 ${itemName} updated to ${newQty}`);
                    }
                });

                saveCartToStorage(cart);
                setCart([...cart]);

                showPopup(messages.join("\n"));
            }
        };

        socket.onerror = (err) => {
            console.error("WebSocket error", err);
        };

        return () => {
            socket.close();
        };
    }, [confirmedOrderId]);

    // Handler for service charges & GST from Navbar
    const handleChargesChange = ({ serviceCharges, gst }) => {
        setServiceCharges(serviceCharges);
        setGst(gst);
    };
    // Add to cart handler (localStorage)
    const handleAddToCart = (item) => {
        const cartArr = getCartFromStorage();
        const found = cartArr.find((cartItem) => cartItem.id === (item._id || item.id));
        if (found) {
            found.quantity += 1;
            found.totalPrice = found.quantity * found.price;
        } else {
            cartArr.push({
                id: item._id || item.id,
                name: item.name,
                price: item.price,
                quantity: 1,
                totalPrice: item.price
            });
        }
        saveCartToStorage(cartArr);
        setCart([...cartArr]);
    };

    // Change quantity in cart (localStorage)
    const handleCartQuantityChange = (id, delta) => {
        if (orderConfirmed) return;
        const cartArr = getCartFromStorage();
        const idx = cartArr.findIndex((item) => item.id === id);
        if (idx !== -1) {
            cartArr[idx].quantity += delta;
            if (cartArr[idx].quantity <= 0) {
                cartArr.splice(idx, 1);
            } else {
                cartArr[idx].totalPrice = cartArr[idx].quantity * cartArr[idx].price;
            }
            saveCartToStorage(cartArr);
            setCart([...cartArr]);
        }
    };

    // Remove item from cart (all quantities)
    const handleRemoveFromCart = (id) => {
        const cartArr = getCartFromStorage().filter((item) => item.id !== id);
        saveCartToStorage(cartArr);
        setCart([...cartArr]);
    };

    // Handler for category change from Navbar
    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
    };

    // Handler for search input change from Navbar
    const handleSearchChange = (term) => {
        setSearchTerm(term);
    };

    // Handler for showing bill
    const handleGenerateBill = () => {
        setShowBill(true);
        setShowCartPopup(false);
        localStorage.setItem("ordersetu_show_bill", "true");
    };

    // Handler for showing cart popup
    const handleShowCartPopup = () => {
        setCart(getCartFromStorage());
        setShowCartPopup(true);
    };

    // Handler for closing cart popup
    const handleCloseCartPopup = () => {
        setShowCartPopup(false);
    };

    // Handler to close bill popup
    const handleCloseBill = () => {
        setShowBill(false);
    };
    //Generating Request ID for bill
    const generateRequestId = () => {
        const now = new Date();

        const YYYY = now.getFullYear();
        const MM = String(now.getMonth() + 1).padStart(2, "0");
        const DD = String(now.getDate()).padStart(2, "0");
        const HR = String(now.getHours()).padStart(2, "0");
        const MI = String(now.getMinutes()).padStart(2, "0");
        const SE = String(now.getSeconds()).padStart(2, "0");
        const MSE = String(now.getMilliseconds()).padStart(3, "0");

        return `${YYYY}${MM}${DD}${HR}${MI}${SE}${MSE}`;
    };

    //calculating the bill amounts 
    const calculateBillTotals = () => {
        const subtotal = cart.reduce(
            (sum, item) => sum + Number(item.price) * Number(item.quantity),
            0
        );

        const gstAmount = Math.round((subtotal * Number(gst)) / 100);
        const grandTotal = subtotal + Number(serviceCharges) + gstAmount;

        return {
            subtotal,
            gstAmount,
            grandTotal
        };
    };

    // Handler for payment button (optional, can be expanded)
    const handleProceedPayment = async () => {
        try {
            const restaurant_id =
                localStorage.getItem("ordersetu_selected_restaurant_id");

            if (!restaurant_id) {
                showPopup("Restaurant not selected");
                return;
            }
            const confirmedOrderId =
                localStorage.getItem("ordersetu_confirmed_order_id");
            if (!confirmedOrderId) {
                showPopup("Confirmed order not found");
                return;
            }
            if (!cart.length) {
                showPopup("Cart is empty");
                return;
            }

            const { subtotal, gstAmount, grandTotal } = calculateBillTotals();

            const requestId = generateRequestId(); // ✅ REQUIRED FORMAT

            const payload = {
                restaurant_id,
                confirmedOrderId,
                requestId,
                items: cart,
                subtotal,
                serviceCharges,
                gst,
                grandTotal,
                paymentStatus: "Pending" //  DEFAULT
            };

            const backendUrl =
                import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

            const res = await fetch(`${backendUrl}/add-bill-request`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to create bill");
            }

            const data = await res.json();

            showPopup(`Bill created successfully\nRequest ID: ${requestId}`);

        } catch (error) {
            console.error("❌ Error creating bill:", error);
            showPopup("Error while creating bill");
        }
    };


    // Handler for menu items change from Navbar
    const handleMenuItemsChange = (items) => {
        setMenuItems(items);
    };

    // Handler for table options change from Navbar
    const handleTableOptionsChange = (options) => {
        setTableOptions(options);
    };

    // Handler for restaurant selection from Navbar
    const handleRestaurantChange = (restaurantId) => {
        setSelectedRestaurant(restaurantId);
        localStorage.setItem("ordersetu_selected_restaurant_id", restaurantId);
    };

    // Handler for table selection from Navbar
    const handleTableChange = (tableNum) => {
        setSelectedTable(tableNum);
        localStorage.setItem("ordersetu_selected_table_number", tableNum);
    };

    // Filter items by selected category and search term, then sort by availability
    const filteredItems = menuItems
        .filter((item) => {
            // Category filter
            const matchesCategory = selectedCategory
                ? item.category &&
                item.category.toLowerCase().replace(/\s/g, "-") === selectedCategory
                : true;
            // Search filter
            const search = searchTerm.trim().toLowerCase();
            const matchesSearch = search
                ? item.name.toLowerCase().includes(search) ||
                item.category.toLowerCase().includes(search)
                : true;
            return matchesCategory && matchesSearch;
        })
        .sort((a, b) => {
            // Treat undefined as available (true)
            const aAvail = typeof a.availability === 'boolean' ? a.availability : (typeof a.available === 'boolean' ? a.available : true);
            const bAvail = typeof b.availability === 'boolean' ? b.availability : (typeof b.available === 'boolean' ? b.available : true);
            // Sort: available first
            if (aAvail === bAvail) return 0;
            return aAvail ? -1 : 1;
        });

    return (
        <>
            <Navbar
                mode="customer"
                dashboardTitle="Customer Dashboard"
                cartItems={cart}
                onCartQuantityChange={handleCartQuantityChange}
                onRemoveFromCart={handleRemoveFromCart}
                onCategoryChange={handleCategoryChange}
                selectedCategory={selectedCategory}
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
                onGenerateBill={handleGenerateBill}
                onMenuItemsChange={handleMenuItemsChange}
                onTableOptionsChange={handleTableOptionsChange}
                onShowCart={handleShowCartPopup}
                onRestaurantChange={handleRestaurantChange}
                onTableChange={handleTableChange}
                selectedRestaurant={selectedRestaurant}
                selectedTable={selectedTable}
                onChargesChange={handleChargesChange}
            />

            {/* OrderSetu-themed Cart Popup */}
            {showCartPopup && (
                <div className="ordersetu-cart-overlay">
                    <div className="ordersetu-cart-popup">
                        <h2 style={{ color: '#ff5f1f', marginBottom: 10 }}>🛒 Your Cart</h2>
                        {cart.length === 0 ? (
                            <div style={{ textAlign: 'center', color: '#888' }}>Cart is empty.</div>
                        ) : (
                            <table className="ordersetu-cart-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Price</th>
                                        <th>Quantity</th>
                                        <th>Total Price</th>
                                        {!orderConfirmed && <th>Quantity Changer</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {cart.map(item => (
                                        <tr key={item.id}>
                                            <td>{item.name}</td>
                                            <td>₹{item.price}</td>
                                            <td>{item.quantity}</td>
                                            <td>₹{item.totalPrice}</td>
                                            {!orderConfirmed && (
                                                <td
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'center',
                                                        alignItems: 'center',
                                                        gap: '8px'
                                                    }}
                                                >
                                                    <button
                                                        className="ordersetu-remove-btn"
                                                        onClick={() => handleCartQuantityChange(item.id, -1)}
                                                    >
                                                        -
                                                    </button>
                                                    <button
                                                        className="ordersetu-remove-btn"
                                                        onClick={() => handleCartQuantityChange(item.id, 1)}
                                                    >
                                                        +
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        <div className="ordersetu-cart-actions">
                            {orderConfirmed ? (
                                <button
                                    className="ordersetu-confirm-btn"
                                    onClick={handleGenerateBill}
                                >
                                    Generate Bill
                                </button>
                            ) : (
                                <>
                                    <button
                                        className="ordersetu-close-btn"
                                        onClick={handleCloseCartPopup}
                                    >
                                        Close
                                    </button>
                                    <button
                                        className="ordersetu-confirm-btn"
                                        onClick={async () => {
                                            const restaurantObjectId =
                                                localStorage.getItem("ordersetu_selected_restaurant_id");
                                            const tableNumber =
                                                localStorage.getItem("ordersetu_selected_table_number");
                                            //Temporary:validating
                                            if (!restaurantObjectId || !tableNumber) {
                                                showPopup("Please select a restaurant and table before confirming order.");
                                                return;
                                            }
                                            const confirmed_items = cart.map(item => ({
                                                item_name: item.name,
                                                quantity: item.quantity,
                                                price: item.price,
                                                total_price: item.totalPrice
                                            }));
                                            try {
                                                const backendUrl =
                                                    import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
                                                const res = await fetch(
                                                    `${backendUrl}/add-confirmed-items`,
                                                    {
                                                        method: "POST",
                                                        headers: {
                                                            "Content-Type": "application/json"
                                                        },
                                                        body: JSON.stringify({
                                                            restaurant_id: restaurantObjectId,
                                                            table_number: Number(tableNumber),
                                                            confirmed_items
                                                        })
                                                    }
                                                );
                                                if (res.ok) {
                                                    const data = await res.json();

                                                    localStorage.setItem(
                                                        "ordersetu_confirmed_order_id",
                                                        data.confirmedOrder._id
                                                    );

                                                    localStorage.setItem("ordersetu_order_confirmed", "true");

                                                    setConfirmedOrderId(data.confirmedOrder._id);
                                                    setOrderConfirmed(true);
                                                    showPopup("Order confirmed! Click Generate Bill to proceed.");
                                                } else {
                                                    showPopup("Failed to confirm order.");
                                                }
                                            } catch (err) {
                                                showPopup("Error confirming order.");
                                            }
                                        }}
                                    >
                                        Confirm
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showBill && (
                <div className="bill-modal-overlay">
                    <div className="bill-modal-content">
                        <Bill
                            items={cart}
                            serviceCharges={serviceCharges}
                            gst={gst}
                            onProceedPayment={handleProceedPayment}
                            onClose={handleCloseBill}
                        />
                    </div>
                </div>
            )}

            {/* OrderSetu Popup Message */}
            {popupMessage && (
                <OrderSetuPopup message={popupMessage} onClose={closePopup} />
            )}

            <div className="customer-container">
                <div className="customer-header">
                    <h1>Welcome to OrderSetu</h1>
                    <p>Explore our delicious menu items</p>
                </div>

                <div className="menu-section">
                    <h2>Available Items</h2>
                    <div className="cards-grid">
                        {filteredItems.map((item) => {
                            // If image is base64 (no http/https), prefix it
                            let imageSrc = item.image;
                            if (imageSrc && !/^https?:\/\//i.test(imageSrc) && !/^data:image/i.test(imageSrc)) {
                                imageSrc = `data:image/jpeg;base64,${imageSrc}`;
                            }
                            // Determine availability: fallback to true if undefined/null
                            let available = true;
                            if (typeof item.availability === 'boolean') {
                                available = item.availability;
                            } else if (typeof item.available === 'boolean') {
                                available = item.available;
                            }
                            return (
                                <Card
                                    key={item._id || item.id}
                                    id={item._id || item.id}
                                    image={imageSrc}
                                    name={item.name}
                                    rating={item.rating}
                                    price={item.price}
                                    description={item.description}
                                    available={available}
                                    category={item.category}
                                    onAddToCart={handleAddToCart}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Customer;