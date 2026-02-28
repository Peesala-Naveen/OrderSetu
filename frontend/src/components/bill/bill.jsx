import React, { useRef } from "react";
import "./bill.css";

const Bill = ({ items = [], serviceCharges = 0, gst = 0, onProceedPayment, onClose }) => {
    const billRef = useRef();

    // Calculate subtotal (sum of qty * price)
    const subtotal = items.reduce(
        (sum, item) => sum + (Number(item.price) * Number(item.quantity)),
        0
    );

    // Calculate service charges and GST as percentage of subtotal
    const serviceChargesAmount = serviceCharges;
    const gstAmount = Math.round((subtotal * Number(gst)) / 100);

    // Grand total
    const totalAmount = subtotal + serviceChargesAmount + gstAmount;

    // Download bill as image/pdf (placeholder, implement as needed)
    const handleDownload = () => {
        window.print();
    };

    return (
        <div className="bill-container" ref={billRef}>
            <div className="bill-header">
                <div className="bill-logo-brand">
                    <img src="/OrderSetu_logo.png" alt="OrderSetu logo" className="bill-logo" />
                    <span className="bill-brand">OrderSetu</span>
                </div>
                <div className="bill-title">
                    Your Bill
                </div>
                <div className="bill-header-actions">
                    <button
                        onClick={handleDownload}
                        className="bill-download-btn"
                        title="Download Bill"
                        aria-label="Download Bill"
                    >
                        ⬇️
                    </button>
                    <button
                        className="bill-modal-close"
                        onClick={() => { if (onClose) onClose(); }}
                        title="Close Bill"
                        aria-label="Close Bill"
                    >
                        ×
                    </button>
                </div>
            </div>
            <div className="bill-body">
                <table className="bill-table">
                    <thead>
                        <tr>
                            <th>Food Item</th>
                            <th>Price</th>
                            <th>Qty</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="bill-no-items">
                                    No items ordered.
                                </td>
                            </tr>
                        ) : (
                            items.map((item, idx) => (
                                <tr key={idx}>
                                    <td>{item.name}</td>
                                    <td>₹{item.price}</td>
                                    <td>{item.quantity}</td>
                                    <td>₹{Number(item.price) * Number(item.quantity)}</td>
                                </tr>
                            ))
                        )}
                        <tr>
                            <td colSpan={3} className="bill-label">Subtotal</td>
                            <td>₹{subtotal}</td>
                        </tr>
                        <tr>
                            <td colSpan={3} className="bill-label">
                                Service Charges ({serviceCharges})
                            </td>
                            <td>₹{serviceChargesAmount}</td>
                        </tr>
                        <tr>
                            <td colSpan={3} className="bill-label">
                                GST ({gst}%)
                            </td>
                            <td>₹{gstAmount}</td>
                        </tr>
                        <tr>
                            <td colSpan={3} className="bill-total-label">Total</td>
                            <td className="bill-total-value">₹{totalAmount}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div className="bill-footer">
                <button
                    onClick={onProceedPayment}
                    className="bill-proceed-btn"
                >
                    Proceed Payment
                </button>
            </div>
        </div>
    );
};

export default Bill;