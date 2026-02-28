import React, { useState, useRef, useEffect } from "react";
import "./addItemToMenu.css";

const AddItemToMenu = ({ onClose }) => {
    const [form, setForm] = useState({
        name: "",
        cost: "",
        description: "",
        image: null
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [aiLoading, setAiLoading] = useState(false);
    const descriptionRef = useRef(null);
    const handleInputChange = (e) => {
        const { name, value, type, files } = e.target;
        if (type === "file") {
            setForm((prev) => ({ ...prev, [name]: files[0] }));
        } else {
            setForm((prev) => ({ ...prev, [name]: value }));
        }
    };
    const handleGenerateDescription = async () => {
        if (!form.name) {
            setError("Enter item name before generating description");
            return;
        }

        try {
            setAiLoading(true);
            setError("");

            const token = localStorage.getItem("token");
            const backendUrl =
                import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

            const res = await fetch(
                `${backendUrl}/api/ai/generate-menu-description`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        name: form.name,
                        cost: form.cost
                    })
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "AI failed");
            }

            setForm(prev => ({
                ...prev,
                description: data.description
            }));

        } catch (err) {
            setError(err.message || "AI generation failed");
        } finally {
            setAiLoading(false);
        }
    };

    useEffect(() => {
        if (descriptionRef.current) {
            descriptionRef.current.style.height = "auto";
            descriptionRef.current.style.height =
                descriptionRef.current.scrollHeight + "px";
        }
    }, [form.description]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");
        try {
            const token = localStorage.getItem("token");
            const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
            const formData = new FormData();
            formData.append("name", form.name);
            formData.append("cost", form.cost);
            formData.append("description", form.description);
            if (form.image) {
                formData.append("image", form.image);
            }
            const res = await fetch(`${backendUrl}/add-menu-item`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.message || "Failed to add item");
            } else {
                setSuccess("Item added successfully!");
                setForm({ name: "", cost: "", description: "", image: null });
            }
        } catch {
            setError("Server error");
        }
        setLoading(false);
    };

    return (
        <div className="add-menu-popup-overlay">
            <div className="add-menu-popup">
                <div className="add-menu-popup-header">
                    Add Item to Menu
                    <button className="add-menu-popup-close" onClick={onClose}>×</button>
                </div>
                <form className="add-menu-popup-form" onSubmit={handleSubmit} encType="multipart/form-data">
                    <input
                        type="text"
                        name="name"
                        placeholder="Item Name"
                        value={form.name}
                        onChange={handleInputChange}
                        required
                    />
                    <input
                        type="number"
                        name="cost"
                        placeholder="Cost"
                        value={form.cost}
                        onChange={handleInputChange}
                        min={0}
                        required
                    />
                    <div className="ai-description-row">
                        <textarea
                            ref={descriptionRef}
                            name="description"
                            placeholder="Description"
                            value={form.description}
                            onChange={handleInputChange}
                            rows={1}
                            className="auto-resize-textarea"
                        />
                        <button
                            type="button"
                            className="ai-generate-btn"
                            onClick={handleGenerateDescription}
                            disabled={aiLoading}
                        >
                            {aiLoading ? "Generating..." : "✨ AI"}
                        </button>
                    </div>
                    <input
                        type="file"
                        name="image"
                        accept="image/*"
                        onChange={handleInputChange}
                    />
                    {error && <div className="add-menu-popup-error">{error}</div>}
                    {success && <div className="add-menu-popup-success">{success}</div>}
                    <button type="submit" className="add-menu-popup-submit" disabled={loading}>
                        {loading ? "Adding..." : "Add Item"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddItemToMenu;
