import React, { useState } from "react";
import toast from "react-hot-toast";
import { recentAlerts as initialAlerts, allInventory } from "../mock/inventoryData";

export default function AlertsView({ orders = [], setOrders, onNavigate }) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [filter, setFilter] = useState("All");

  // Draft Flow States
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [activeAlert, setActiveAlert] = useState(null);
  const [draftProduct, setDraftProduct] = useState(null);
  const [draftQty, setDraftQty] = useState(100);
  const [draftSupplier, setDraftSupplier] = useState("ABC Distributors");

  const handleResolve = (id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleOpenDraftModal = (alert) => {
    // Find the product details from catalog
    const product = allInventory.find(
      (item) => item.sku.toUpperCase() === alert.sku.toUpperCase()
    ) || {
      name: alert.message.replace(" stock below threshold", "").replace(" low stock", ""),
      sku: alert.sku,
      supplier: "ABC Distributors",
      reorderThreshold: 50,
      currentStock: 10
    };

    // Calculate dynamic recommended quantity
    const recommendedQty = Math.max(50, (product.reorderThreshold * 2) - product.currentStock);

    setActiveAlert(alert);
    setDraftProduct(product);
    setDraftQty(recommendedQty);
    setDraftSupplier(product.supplier);
    setShowDraftModal(true);
  };

  const handleCreateDraftPO = (e) => {
    e.preventDefault();
    if (!setOrders) {
      toast.error("Order service is currently unavailable.");
      return;
    }

    const unitPrice = draftProduct?.sku?.includes("COK") ? 1.25 
                    : draftProduct?.sku?.includes("LAY") ? 1.20 
                    : draftProduct?.sku?.includes("MILK") ? 1.40 
                    : 1.50;

    const newDraftPO = {
      poNumber: `PO-2026-D${orders.length + 1}`,
      product: draftProduct.name,
      supplier: draftSupplier,
      date: new Date().toISOString().split("T")[0],
      quantity: draftQty,
      cost: draftQty * unitPrice,
      status: "Draft",
      eta: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      etaTime: "10:00 AM",
      type: "Draft Order"
    };

    setOrders((prev) => [newDraftPO, ...prev]);
    setShowDraftModal(false);
    setShowSuccessModal(true);
    
    // Resolve the alert since we created a draft PO for it
    if (activeAlert) {
      handleResolve(activeAlert.id);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filter === "All") return true;
    return a.severity === filter;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="section-header">
        <h2 className="section-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--danger)" }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          Notification Center
        </h2>
        <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 550 }}>
          {alerts.length} unresolved system warnings
        </span>
      </div>

      {/* Filter row */}
      <div className="inventory-section-card" style={{ padding: "20px" }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>Filter by Severity:</span>
          {["All", "Critical", "Warning", "Info"].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilter(sev)}
              className={`status-badge ${sev === filter ? "healthy" : ""}`}
              style={{ 
                border: sev === filter ? "1px solid var(--primary)" : "1px solid var(--border)", 
                cursor: "pointer", 
                backgroundColor: sev === filter ? "var(--primary-light)" : "white",
                color: sev === filter ? "var(--primary)" : "var(--text-secondary)"
              }}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((a) => (
            <div key={a.id} className={`alert-card-item ${a.severity.toLowerCase()}`} style={{ justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: "16px" }}>
                <div className="alert-icon-wrap" style={{ marginTop: "4px" }}>
                  {a.severity === "Critical" ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--danger)" }}>
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                  ) : a.severity === "Warning" ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--warning)" }}>
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                      <line x1="12" y1="9" x2="12" y2="13"></line>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--primary)" }}>
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                  )}
                </div>
                <div className="alert-content">
                  <span className="alert-title-text" style={{ fontSize: "1rem" }}>{a.message}</span>
                  <div style={{ display: "flex", gap: "12px", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    <span style={{ fontFamily: "monospace" }}>SKU: {a.sku}</span>
                    <span>•</span>
                    <span>Received {a.timestamp}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons on the right side of the card */}
              <div style={{ display: "flex", gap: "10px" }}>
                <button 
                  className="btn-rec-action approve" 
                  onClick={() => handleOpenDraftModal(a)}
                  style={{ borderRadius: "8px", fontSize: "0.8rem", padding: "8px 16px" }}
                >
                  Create PO
                </button>
                <button 
                  className="btn-rec-action modify" 
                  onClick={() => handleResolve(a.id)}
                  style={{ borderRadius: "8px", fontSize: "0.8rem", padding: "8px 16px" }}
                >
                  Acknowledge
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="placeholder-card empty-state">
            <div className="placeholder-icon-wrap" style={{ backgroundColor: "var(--success-bg)", color: "var(--success)" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <p className="placeholder-text">All alerts resolved. System is running healthy!</p>
          </div>
        )}
      </div>

      {/* ── 1. DRAFT PO CREATION MODAL ── */}
      {showDraftModal && draftProduct && (
        <div className="modal-overlay" onClick={() => setShowDraftModal(false)}>
          <div className="modal-content animate-scale-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
            <div className="modal-icon-container" style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
              </svg>
            </div>
            <h3 className="modal-title">Draft Purchase Order</h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", textAlign: "center", marginBottom: "16px" }}>
              Configure order parameters before saving as a draft.
            </p>
            
            <form onSubmit={handleCreateDraftPO} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Product Name</label>
                <input 
                  type="text" 
                  value={draftProduct.name} 
                  disabled
                  className="rec-qty-input"
                  style={{ width: "100%", height: "40px", backgroundColor: "#f1f5f9", cursor: "not-allowed" }}
                />
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>SKU Code</label>
                  <input 
                    type="text" 
                    value={draftProduct.sku} 
                    disabled 
                    className="rec-qty-input"
                    style={{ width: "100%", height: "40px", backgroundColor: "#f1f5f9", cursor: "not-allowed" }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Supplier Partner</label>
                  <select 
                    value={draftSupplier} 
                    onChange={(e) => setDraftSupplier(e.target.value)}
                    className="rec-qty-input"
                    style={{ width: "100%", height: "40px" }}
                  >
                    <option value="ABC Distributors">ABC Distributors</option>
                    <option value="Dairy Fresh">Dairy Fresh</option>
                    <option value="Grain Suppliers">Grain Suppliers</option>
                    <option value="Fresh Farms">Fresh Farms</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Draft Quantity (units)</label>
                <div className="qty-adjuster-wrap" style={{ width: "100%", justifyContent: "center" }}>
                  <button
                    type="button"
                    className="btn-qty-adj dec"
                    onClick={() => setDraftQty(prev => Math.max(10, prev - 10))}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </button>
                  <input
                    type="number"
                    className="rec-qty-input-field"
                    value={draftQty}
                    min="1"
                    onChange={(e) => setDraftQty(parseInt(e.target.value) || 0)}
                    style={{ textAlign: "center", width: "100px" }}
                  />
                  <button
                    type="button"
                    className="btn-qty-adj inc"
                    onClick={() => setDraftQty(prev => prev + 10)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "12px" }}>
                <button type="button" className="btn-rec-global cancel" onClick={() => setShowDraftModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-rec-global save">
                  Create Draft PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 2. SUCCESS CONFIRMATION MODAL ── */}
      {showSuccessModal && (
        <div className="modal-overlay" style={{ zIndex: 3000 }}>
          <div className="modal-content animate-scale-in" style={{ maxWidth: "460px" }}>
            <div className="modal-icon-container" style={{ backgroundColor: "var(--success-bg)", color: "var(--success)" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 8 8 12 12 16"></polyline>
                <line x1="16" y1="12" x2="8" y2="12"></line>
              </svg>
            </div>
            <h3 className="modal-title">Draft PO Created</h3>
            <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: "12px 0 20px", textAlign: "center" }}>
              Draft purchase order has been successfully saved to the <strong>Orders tab</strong> under the "Drafted Purchase Orders" queue.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", width: "100%" }}>
              <button 
                className="btn-rec-global cancel" 
                onClick={() => setShowSuccessModal(false)}
                style={{ padding: "10px 20px" }}
              >
                Continue Browsing
              </button>
              <button 
                className="btn-rec-global save" 
                onClick={() => {
                  setShowSuccessModal(false);
                  onNavigate("orders");
                }}
                style={{ padding: "10px 20px" }}
              >
                Go to Orders
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
