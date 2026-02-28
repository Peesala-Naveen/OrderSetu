import React, { useEffect, useState } from "react";
import "./editMenu.css";

// OrderSetu Popup Component
const OrderSetuPopup = ({ message, onClose }) => (
    <div className="ordersetu-popup-overlay">
        <div className="ordersetu-popup-box">
            <div className="ordersetu-popup-message">{message}</div>
            <button className="ordersetu-popup-close-btn" onClick={onClose}>OK</button>
        </div>
    </div>
);

const EditMenu = ({ onClose }) => {
    const [menuItems, setMenuItems] = useState([]);
    // Popup state
    const [popupMessage, setPopupMessage] = useState("");
    const showPopup = (msg) => setPopupMessage(msg);
    const closePopup = () => setPopupMessage("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [editPopup, setEditPopup] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [editForm, setEditForm] = useState({
        name: "",
        cost: "",
        description: "",
        image: "",
        availability: true
    });
    // Delete confirmation popup state
    const [deleteConfirm, setDeleteConfirm] = useState({ show: false, itemId: null });

    useEffect(() => {
        const fetchMenu = async () => {
            setLoading(true);
            setError("");
            setMenuItems([]);
            try {
                const token = localStorage.getItem("token");
                const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
                const res = await fetch(`${backendUrl}/get-menu`, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                if (!res.ok) {
                    const data = await res.json();
                    setError(data.message || "Failed to fetch menu items");
                } else {
                    const data = await res.json();
                    setMenuItems(data.items || []);
                }
            } catch {
                setError("Server error");
            }
            setLoading(false);
        };
        fetchMenu();
    }, []);

    const handleEdit = (item) => {
        setEditItem(item);
        setEditForm({
            name: item.name || "",
            cost: item.cost || "",
            description: item.description || "",
            image: item.image || "",
            availability: typeof item.availability === 'boolean' ? item.availability : true
        });
        setEditPopup(true);
    };

    // Show confirmation popup for delete
    const handleDelete = (itemId) => {
        setDeleteConfirm({ show: true, itemId });
    };

    // Confirm delete action
    const confirmDelete = async () => {
        const itemId = deleteConfirm.itemId;
        setDeleteConfirm({ show: false, itemId: null });
        try {
            const token = localStorage.getItem("token");
            const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
            const res = await fetch(
                `${backendUrl}/delete-item-from-menu/${itemId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            if (!res.ok) {
                const data = await res.json();
                showPopup(data.message || "Failed to delete item");
                return;
            }
            setMenuItems(prev => prev.filter(item => item._id !== itemId));
            showPopup("Menu item deleted successfully");
        } catch (error) {
            showPopup("Server error while deleting item");
        }
    };

    // Cancel delete action
    const cancelDelete = () => {
        setDeleteConfirm({ show: false, itemId: null });
    };

    const handleEditFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleEditFormImageChange = (e) => {
        const file = e.target.files[0];
        setEditForm(prev => ({ ...prev, image: file }));
    };

    const handleEditSave = async () => {
        if (!editItem) return;
        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
        const token = localStorage.getItem("token");
        let body;
        let headers = {
            "Authorization": `Bearer ${token}`
        };
        let isMultipart = !!editForm.image && editForm.image instanceof File;
        if (isMultipart) {
            body = new FormData();
            body.append("name", editForm.name);
            body.append("cost", editForm.cost);
            body.append("description", editForm.description);
            body.append("image", editForm.image);
            body.append("availability", editForm.availability);
        } else {
            headers["Content-Type"] = "application/json";
            body = JSON.stringify({
                name: editForm.name,
                cost: editForm.cost,
                description: editForm.description,
                image: editForm.image,
                availability: editForm.availability
            });
        }
        try {
            const res = await fetch(`${backendUrl}/edit-menu/${editItem._id}`, {
                method: "PATCH",
                headers,
                body
            });
            if (res.ok) {
                const data = await res.json();
                setMenuItems(items =>
                    items.map(i =>
                        i._id === editItem._id ? { ...i, ...data.item } : i
                    )
                );
                setEditPopup(false);
                setEditItem(null);
            } else {
                showPopup("Failed to update menu item.");
            }
        } catch {
            showPopup("Error updating menu item.");
        }
    };

    const handleEditCancel = () => {
        setEditPopup(false);
        setEditItem(null);
    };

    return (
        <>
            {popupMessage && (
                <OrderSetuPopup message={popupMessage} onClose={closePopup} />
            )}
            {deleteConfirm.show && (
                <div className="editmenu-confirm-overlay">
                    <div className="editmenu-confirm-box">
                        <div className="editmenu-confirm-message">
                            Are you sure you want to delete this item?
                        </div>
                        <div className="editmenu-confirm-actions">
                            <button className="editmenu-confirm-btn delete" onClick={confirmDelete}>Delete</button>
                            <button className="editmenu-confirm-btn cancel" onClick={cancelDelete}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
            <div className="edit-menu-popup-overlay">
                <div className="edit-menu-popup">
                    <div className="edit-menu-popup-header">
                        Edit Menu
                        <button className="edit-menu-popup-close" onClick={onClose}>×</button>
                    </div>
                    {loading ? (
                        <div className="edit-menu-popup-loading">Loading...</div>
                    ) : error ? (
                        <div className="edit-menu-popup-error">{error}</div>
                    ) : (
                        <div className="edit-menu-popup-list">
                            {menuItems.length === 0 ? (
                                <div className="edit-menu-popup-empty">No menu items found.</div>
                            ) : (
                                menuItems.map(item => {
                                    let desc = item.description || "";
                                    let descWords = desc.split(" ");
                                    let shortDesc = descWords.slice(0, 3).join(" ");
                                    let remainder = descWords.length > 3 ? " ..." : "";
                                    return (
                                        <div className="edit-menu-popup-item" key={item._id}>
                                            <div>
                                                <b>{item.name}</b> - ₹{item.cost}
                                                <div style={{ fontSize: "0.95em", color: "#555" }}>
                                                    {shortDesc}{remainder}
                                                </div>
                                            </div>
                                            <div className="edit-menu-actions">
                                                <button
                                                    className="edit-menu-popup-edit-btn"
                                                    onClick={() => handleEdit(item)}
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    className="edit-menu-popup-delete-btn"
                                                    onClick={() => handleDelete(item._id)}
                                                    title="Remove item"
                                                >
                                                    🗑
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
                {editPopup && editItem && (
                    <div className="edit-menu-modal">
                        <div className="edit-menu-modal-content">
                            <h3>Edit Menu Item</h3>
                            <label>
                                Name:
                                <input
                                    type="text"
                                    name="name"
                                    value={editForm.name}
                                    onChange={handleEditFormChange}
                                    required
                                />
                            </label>
                            <label>
                                Cost:
                                <input
                                    type="number"
                                    name="cost"
                                    value={editForm.cost}
                                    onChange={handleEditFormChange}
                                    min="0"
                                    required
                                />
                            </label>
                            <label>
                                Description:
                                <input
                                    type="text"
                                    name="description"
                                    value={editForm.description}
                                    onChange={handleEditFormChange}
                                />
                            </label>
                            <label>
                                Image:
                                <input
                                    type="file"
                                    name="image"
                                    accept="image/*"
                                    onChange={handleEditFormImageChange}
                                />
                            </label>
                            <label style={{ display: "flex", alignItems: "center", gap: "0.5em" }}>
                                <input
                                    type="checkbox"
                                    name="availability"
                                    checked={!!editForm.availability}
                                    onChange={handleEditFormChange}
                                />
                                Available
                            </label>
                            <div className="edit-menu-modal-actions">
                                <button onClick={handleEditSave} className="edit-menu-save-btn">Save</button>
                                <button onClick={handleEditCancel} className="edit-menu-cancel-btn">Cancel</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default EditMenu;
