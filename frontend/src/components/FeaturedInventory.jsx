import React from "react";
import { featuredProducts } from "../mock/inventoryData";

export default function FeaturedInventory() {
  return (
    <div className="featured-section">
      <div className="section-header">
        <h2 className="section-title">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            style={{ color: "var(--primary)" }}
          >
            <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"></polygon>
            <line x1="12" y1="22" x2="12" y2="12"></line>
            <line x1="12" y1="12" x2="22" y2="8.5"></line>
            <line x1="12" y1="12" x2="2" y2="8.5"></line>
            <polyline points="2 15.5 12 18.7 22 15.5"></polyline>
            <polyline points="12 2 12 12"></polyline>
          </svg>
          Featured Stock Items
        </h2>
        <span style={{ fontSize: "0.85rem", color: "var(--primary)", fontWeight: 600 }}>
          High Priority Focus
        </span>
      </div>

      <div className="featured-grid">
        {featuredProducts.map((product) => {
          // Normalize status name for CSS class
          const statusClass = product.status.replace(/\s+/g, "").toLowerCase();
          return (
            <div key={product.id} className="product-card">
              <div className="product-image-container">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="product-image"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200"; // Fallback image
                  }}
                />
              </div>
              <div className="product-card-body">
                <span className="product-sku-badge">{product.sku}</span>
                <h3 className="product-name">{product.name}</h3>
                <span className="product-stock-text">Stock: {product.stock} units</span>
                <div style={{ marginTop: "4px" }}>
                  <span className={`status-badge ${statusClass}`}>
                    {product.status}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
