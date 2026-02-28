import React from "react";
import "./footer.css";

const Footer = () => {
    return (
        <footer className="ordersetu-footer">
            <div className="footer-main">
                <div className="footer-logo">OrderSetu</div>

                <div className="footer-contact">
                    <h4>Contact the Developer:</h4>
                    <ul>
                        <li>
                            <a
                                href={import.meta.env.VITE_LINKEDIN_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                LinkedIn
                            </a>
                        </li>
                        <li>
                            <a href={`mailto:${import.meta.env.VITE_MAIL}`}>
                                Mail {import.meta.env.MAIL}
                            </a>
                        </li>
                        <li>
                            <a
                                href={import.meta.env.VITE_GITHUB_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                GitHub
                            </a>
                        </li>
                        <li>Mobile: +91-9885610591</li>
                    </ul>
                </div>
            </div>

            <div className="footer-bottom">
                © {new Date().getFullYear()} OrderSetu. All rights reserved.
            </div>
        </footer >
    );
};

export default Footer;