import "./card.css";

const Card = ({
    id,
    image,
    name,
    rating = 4.5,
    price,
    description,
    onAddToCart,
    available = true,
    category = "General",

}) => {

    const handleAddToCart = () => {
        if (onAddToCart && available) {
            onAddToCart({
                id,
                name,
                price,
                image,
                quantity: 1,
            });
        }
    };

    // Render star rating
    const renderStars = () => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;

        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars.push(
                    <span key={i} className="star filled">
                        ★
                    </span>
                );
            } else if (i === fullStars && hasHalfStar) {
                stars.push(
                    <span key={i} className="star half">
                        ★
                    </span>
                );
            } else {
                stars.push(
                    <span key={i} className="star empty">
                        ☆
                    </span>
                );
            }
        }
        return stars;
    };

    return (
        <div className="food-card">
            {/* Image Section */}
            <div className="card-image-container">
                <img src={image} alt={name} className="card-image" />
                {/* Availability Status Badge */}
                <span className={`availability-badge ${available ? "available" : "unavailable"}`}>
                    {available ? "✓ Available" : "✗ Not Available"}
                </span>
            </div>

            {/* Card Content */}
            <div className="card-content">
                {/* Category Label */}
                <span className="card-category-label">{category}</span>
                {/* Name */}
                <h3 className="card-name">{name}</h3>

                {/* Rating */}
                <div className="card-rating">
                    <div className="stars">{renderStars()}</div>
                    <span className="rating-value">({rating})</span>
                </div>

                {/* Description */}
                <p className="card-description">{description}</p>

                {/* Footer with Price and Button */}
                <div className="card-footer">
                    <div className="card-price">
                        <span className="currency">₹</span>
                        <span className="price-value">{price}</span>
                    </div>
                    <button
                        className={`add-to-cart-btn ${!available ? "disabled" : ""}`}
                        onClick={handleAddToCart}
                        disabled={!available}
                        title={available ? "Add to cart" : "Currently unavailable"}
                    >
                        🛒 Add
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Card;
