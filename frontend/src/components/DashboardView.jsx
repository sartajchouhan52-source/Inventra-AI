import React from "react";
import KPICards from "./KPICards";
import ProcurementRecommendations from "./ProcurementRecommendations";

export default function DashboardView({ 
  orders,
  hasAnalysis, 
  isLoading, 
  approvedPOInfo,
  onApprove, 
  onReject, 
  onGoToOrders,
  onNavigate,
  onViewEmail
}) {
  // Low Stock Items derived
  const lowStockSummary = [
    { name: "Lays Classic 150g", sku: "LAY-CLS-150", stock: 18, threshold: 40, status: "Critical" },
    { name: "Coca-Cola 500ml", sku: "COK-CLS-500", stock: 30, threshold: 50, status: "Low Stock" },
    { name: "Amul Milk 1L", sku: "MILK-AML-1L", stock: 42, threshold: 60, status: "Low Stock" },
    { name: "Fresh Strawberries", sku: "STR-FRE-250", stock: 8, threshold: 20, status: "Critical" }
  ];

  // Active Shipments/Deliveries overview
  const transitOrders = orders.filter(o => o.status === "In Transit" || o.status === "Sent to Supplier");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Executive KPIs */}
      <KPICards />

      {/* Grid of Executive Widgets */}
      <div className="dashboard-body-grid">
        
        {/* Left Column - Store Health & Action Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Store Health circular widget */}
          <div className="inventory-section-card" style={{ padding: "24px", display: "flex", gap: "20px", alignItems: "center" }}>
            <div style={{ position: "relative", width: "100px", height: "100px", flexShrink: 0 }}>
              <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                <circle cx="18" cy="18" r="16" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                <circle 
                  cx="18" 
                  cy="18" 
                  r="16" 
                  fill="none" 
                  stroke="var(--success)" 
                  strokeWidth="3" 
                  strokeDasharray="100"
                  strokeDashoffset="5.2" // 94.8% health
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 0.5s ease" }}
                />
              </svg>
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", fontSize: "1.1rem", fontWeight: 800 }}>
                94.8%
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <h3 className="section-title" style={{ fontSize: "1rem" }}>Inventory SLA & Health</h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                SLA fulfillment targets are green. Average safety margin buffers remain stable at <strong>Chicago Central Hub</strong> terminal.
              </p>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="inventory-section-card quick-actions-card">
            <div className="quick-actions-header">
              <h3 className="section-title" style={{ fontSize: "1.1rem" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--primary)" }}>
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
                Quick Actions
              </h3>
              <span className="quick-actions-subtitle">Jump to key workflows</span>
            </div>
            <div className="quick-actions-grid">
              <button 
                onClick={() => onNavigate("inventory")}
                className="quick-action-item"
              >
                <div className="quick-action-icon" style={{ background: "linear-gradient(135deg, #e0e7ff, #c7d2fe)", color: "var(--primary)" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6"></line>
                    <line x1="8" y1="12" x2="21" y2="12"></line>
                    <line x1="8" y1="18" x2="21" y2="18"></line>
                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                  </svg>
                </div>
                <div className="quick-action-text">
                  <span className="quick-action-label">Manage Stock</span>
                  <span className="quick-action-desc">Browse & edit catalog</span>
                </div>
                <svg className="quick-action-arrow" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>

              <button 
                onClick={() => onNavigate("orders")}
                className="quick-action-item"
              >
                <div className="quick-action-icon" style={{ background: "linear-gradient(135deg, #ecfdf5, #a7f3d0)", color: "var(--success-text)" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="12" y1="18" x2="12" y2="12"></line>
                    <line x1="9" y1="15" x2="15" y2="15"></line>
                  </svg>
                </div>
                <div className="quick-action-text">
                  <span className="quick-action-label">Draft Custom PO</span>
                  <span className="quick-action-desc">Create purchase order</span>
                </div>
                <svg className="quick-action-arrow" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>

              <button 
                onClick={() => onNavigate("deliveries")}
                className="quick-action-item"
              >
                <div className="quick-action-icon" style={{ background: "linear-gradient(135deg, #fffbeb, #fde68a)", color: "var(--warning-text)" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="3" width="15" height="13"></rect>
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                    <circle cx="5.5" cy="18.5" r="2.5"></circle>
                    <circle cx="18.5" cy="18.5" r="2.5"></circle>
                  </svg>
                </div>
                <div className="quick-action-text">
                  <span className="quick-action-label">Track Shipments</span>
                  <span className="quick-action-desc">Live delivery status</span>
                </div>
                <svg className="quick-action-arrow" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>

              <button 
                onClick={() => onNavigate("settings")}
                className="quick-action-item"
              >
                <div className="quick-action-icon" style={{ background: "linear-gradient(135deg, #fef2f2, #fecaca)", color: "var(--danger)" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                </div>
                <div className="quick-action-text">
                  <span className="quick-action-label">AI Model Configs</span>
                  <span className="quick-action-desc">Tune agent settings</span>
                </div>
                <svg className="quick-action-arrow" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          </div>

        </div>

        {/* Right Column - Low Stock Summary & Active Shipments */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Low Stock Summary list */}
          <div className="inventory-section-card" style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 className="section-title" style={{ fontSize: "1.1rem" }}>Low Stock Summary</h3>
              <span className="alerts-view-all" onClick={() => onNavigate("inventory")} style={{ fontSize: "0.8rem", color: "var(--primary)", fontWeight: 700, cursor: "pointer" }}>
                Full Catalog
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {lowStockSummary.map((item) => (
                <div key={item.sku} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", border: "1px solid var(--border)", borderRadius: "8px", backgroundColor: "#fafbfc" }}>
                  <div>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>{item.name}</span>
                    <span style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "monospace" }}>SKU: {item.sku}</span>
                  </div>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      <strong>{item.stock}</strong> / {item.threshold} units
                    </span>
                    <span className={`status-badge ${item.status.replace(/\s+/g, "").toLowerCase()}`} style={{ fontSize: "0.6rem", padding: "2px 6px" }}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Purchase Orders and Delivery Summary */}
          <div className="inventory-section-card" style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 className="section-title" style={{ fontSize: "1.1rem" }}>Pending PO Transmittals</h3>
              <span className="alerts-view-all" onClick={() => onNavigate("orders")} style={{ fontSize: "0.8rem", color: "var(--primary)", fontWeight: 700, cursor: "pointer" }}>
                All Orders
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {transitOrders.length > 0 ? (
                transitOrders.slice(0, 2).map((order) => (
                  <div key={order.poNumber} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", border: "1px solid var(--border)", borderRadius: "8px", backgroundColor: "#fafbfc" }}>
                    <div>
                      <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>{order.poNumber}</span>
                      <span style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)" }}>{order.product}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span className="status-badge warning" style={{ fontSize: "0.6rem" }}>{order.status}</span>
                      <span style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>ETA: {order.eta}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textAlign: "center", padding: "12px 0" }}>No pending POs. All transmittals verified.</p>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Procurement Recommendations widget inside Dashboard */}
      <ProcurementRecommendations 
        hasAnalysis={hasAnalysis}
        isLoading={isLoading}
        approvedPOInfo={approvedPOInfo}
        onApprove={onApprove}
        onReject={onReject}
        onGoToOrders={onGoToOrders}
        onViewEmail={onViewEmail}
      />
    </div>
  );
}
