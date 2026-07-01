import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";

export default function ProcurementRecommendations({ 
  hasAnalysis, 
  isLoading, 
  approvedPOInfo,
  onApprove, 
  onReject, 
  onGoToOrders,
  onViewEmail
}) {
  const originalQuantities = {
    "LAY-CLS-150": 100,
    "COK-CLS-500": 150,
    "MILK-AML-1L": 80
  };

  const initialRecommendations = [
    {
      sku: "LAY-CLS-150",
      product: "Lays Classic 150g",
      suggestedQuantity: 100,
      unitPrice: 1.20,
      supplier: "ABC Distributors",
      reasoning: "Current stock (18 units) is critically below safety threshold (40 units). Demand forecast shows a 15% increase in snack consumption over the next fortnight.",
      priority: "Critical"
    },
    {
      sku: "COK-CLS-500",
      product: "Coca-Cola 500ml",
      suggestedQuantity: 150,
      unitPrice: 1.25,
      supplier: "ABC Distributors",
      reasoning: "Stock level is low (30 units remaining vs threshold 50). Historically high sales velocity during upcoming mid-summer weekend promotions.",
      priority: "Low Stock"
    },
    {
      sku: "MILK-AML-1L",
      product: "Amul Milk 1L",
      suggestedQuantity: 80,
      unitPrice: 1.40,
      supplier: "Dairy Fresh",
      reasoning: "Stock at 42 units is below reorder point (60 units). Expiration of current batch is approaching, requiring fresh stock replenishment.",
      priority: "Low Stock"
    }
  ];

  const [recs, setRecs] = useState(initialRecommendations);
  const [isEditing, setIsEditing] = useState(false);
  const [tempRecs, setTempRecs] = useState(initialRecommendations);
  
  // Under-Order Warning Modal States
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");

  // Reject Confirmation Modal State
  const [showRejectModal, setShowRejectModal] = useState(false);

  const containerRef = useRef(null);

  // Auto-scroll E2E UX when analysis completes
  useEffect(() => {
    if (hasAnalysis && containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [hasAnalysis]);

  useEffect(() => {
    if (!hasAnalysis && !approvedPOInfo) {
      setRecs(initialRecommendations);
      setIsEditing(false);
    }
  }, [hasAnalysis, approvedPOInfo]);

  const handleStartModify = () => {
    setTempRecs(JSON.parse(JSON.stringify(recs)));
    setIsEditing(true);
  };

  const handleQuantityChange = (sku, val) => {
    setTempRecs((prev) =>
      prev.map((item) => {
        if (item.sku === sku) {
          const newQty = Math.max(0, val);
          return {
            ...item,
            suggestedQuantity: newQty
          };
        }
        return item;
      })
    );
  };

  const handleSaveChangesClick = () => {
    // Check if any modified quantity is below the original recommended quantity
    const underOrderedItem = tempRecs.find(
      (item) => item.suggestedQuantity < originalQuantities[item.sku]
    );

    if (underOrderedItem) {
      setWarningMessage(
        `Warning: The selected quantity for ${underOrderedItem.product} (${underOrderedItem.suggestedQuantity} units) is below the AI recommended safe stock level (${originalQuantities[underOrderedItem.sku]} units). This may not satisfy projected demand and could result in stock shortages.`
      );
      setShowWarningModal(true);
    } else {
      setRecs(tempRecs);
      setIsEditing(false);
    }
  };

  const handleProceedWarningAnyway = () => {
    setRecs(tempRecs);
    setIsEditing(false);
    setShowWarningModal(false);
  };

  const handleCancelChanges = () => {
    setIsEditing(false);
  };

  const handleApproveAll = () => {
    onApprove(recs);
  };

  const handleRejectAll = () => {
    setShowRejectModal(true);
  };

  const handleConfirmReject = () => {
    setShowRejectModal(false);
    onReject();
    toast("All procurement recommendations have been rejected. No purchase orders were created.", {
      icon: '🚫',
      duration: 4500,
      style: {
        borderLeft: '4px solid var(--danger)',
        background: '#fff',
        color: 'var(--text-primary)',
      },
    });
  };

  // Render Skeleton Loader rows
  const renderSkeletonLoader = () => {
    return (
      <div className="table-wrapper rec-table-wrapper skeleton-container">
        <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", gap: "12px" }}>
            <div className="skeleton-bar" style={{ width: "80px", height: "20px" }}></div>
            <div className="skeleton-bar" style={{ width: "200px", height: "20px" }}></div>
          </div>
          <div className="skeleton-bar" style={{ width: "100%", height: "12px" }}></div>
          <div className="skeleton-bar" style={{ width: "80%", height: "12px" }}></div>
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className="recommendations-container" style={{ marginTop: "12px", marginBottom: "24px" }}>
      
      {/* 1. If PO is approved successfully, render the Success Card */}
      {approvedPOInfo ? (
        <div className="po-success-card animate-scale-in">
          <div className="po-success-icon-wrap">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="36" 
              height="36" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="3" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h3 className="po-success-title">Purchase Order Successfully Created</h3>
          
          <div className="po-success-details">
            <div className="po-success-detail-row">
              <span className="po-lbl">PO Reference IDs</span>
              <span className="po-val">{approvedPOInfo.poNumber}</span>
            </div>
            <div className="po-success-detail-row">
              <span className="po-lbl">Supplier Partnerships</span>
              <span className="po-val">{approvedPOInfo.supplier}</span>
            </div>
            <div className="po-success-detail-row">
              <span className="po-lbl">Total Procurement Qty</span>
              <span className="po-val">{approvedPOInfo.quantity} units</span>
            </div>
            <div className="po-success-detail-row">
              <span className="po-lbl">Total Estimated Outlay</span>
              <span className="po-val" style={{ color: "var(--success-text)", fontWeight: 700 }}>
                ${approvedPOInfo.cost.toFixed(2)}
              </span>
            </div>
          </div>

          <p className="po-success-footer">View complete order details in the Orders section.</p>
          
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <button className="btn-rec-global save" onClick={onGoToOrders} style={{ padding: "12px 32px", fontSize: "0.95rem" }}>
              Go to Orders
            </button>
            {onViewEmail && (
              <button 
                className="btn-rec-global modify-all" 
                onClick={() => onViewEmail({
                  poNumber: approvedPOInfo.poNumber,
                  product: approvedPOInfo.supplier?.includes("&") || approvedPOInfo.poNumber?.includes(",") ? "Replenishment Batch Items" : "Procured SKU replenishment",
                  supplier: approvedPOInfo.supplier,
                  quantity: approvedPOInfo.quantity,
                  cost: approvedPOInfo.cost,
                  eta: "3 days"
                })} 
                style={{ padding: "12px 32px", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "8px" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                View Sent Email
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Otherwise, render standard header & state loaders/tables */
        <>
          {hasAnalysis && !isLoading && (
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px", marginBottom: "24px" }} className="animate-fade-in">
              
              {/* AI INSIGHTS CARD */}
              <div className="inventory-section-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "12px", borderLeft: "4px solid var(--primary)" }}>
                <h3 className="section-title" style={{ fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "6px" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--primary)" }}>
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="7.5 4.21 12 6.81 16.5 4.21"></polyline>
                  </svg>
                  AI Insights Summary
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", fontSize: "0.85rem" }}>
                  <div>
                    <span style={{ color: "var(--text-secondary)", display: "block" }}>Demand Trend Forecast</span>
                    <strong style={{ color: "var(--primary)" }}>Increasing (+15% Velocity)</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-secondary)", display: "block" }}>Model Confidence Score</span>
                    <strong>98.2% Accurate</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-secondary)", display: "block" }}>Projected Stockout Date</span>
                    <strong style={{ color: "var(--danger)" }}>Oct 30, 2026 (5 Days)</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-secondary)", display: "block" }}>Suggested Procurement</span>
                    <strong>330 consolidated units</strong>
                  </div>
                </div>
                <div style={{ marginTop: "6px", fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.4, borderTop: "1px dashed var(--border)", paddingTop: "8px" }}>
                  <strong>AI Reasoning:</strong> Out-of-stock threats detected on 3 core snack and dairy SKUs. Promoting proactive transmittals to avoid service level agreement defaults.
                </div>
              </div>

              {/* AI WORKFLOW TRACKER */}
              <div className="inventory-section-card" style={{ padding: "24px" }}>
                <h3 className="section-title" style={{ fontSize: "1.1rem", marginBottom: "12px" }}>AI Workflow Lifecycle</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {[
                    { label: "Inventory Assessment", done: true },
                    { label: "Demand Trend Forecast", done: true },
                    { label: "Supplier Partnership Review", done: true },
                    { label: "AI Recommendations Generated", done: true },
                    { label: "Awaiting Human-in-the-Loop Approval", done: false, active: true },
                    { label: "Purchase Order Transmission", done: false },
                    { label: "Supplier Email Dispatch", done: false }
                  ].map((step, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.8rem" }}>
                      <div style={{ 
                        width: "18px", 
                        height: "18px", 
                        borderRadius: "50%", 
                        border: "2px solid", 
                        borderColor: step.done ? "var(--success)" : step.active ? "var(--primary)" : "#cbd5e1",
                        backgroundColor: step.done ? "var(--success)" : "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: step.done ? "white" : "transparent"
                      }}>
                        {step.done && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        )}
                      </div>
                      <span style={{ 
                        fontWeight: step.active || step.done ? 600 : 400, 
                        color: step.active ? "var(--primary)" : step.done ? "var(--text-primary)" : "var(--text-muted)" 
                      }}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          <div className="section-header" style={{ marginBottom: "16px" }}>
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
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              {isEditing ? "Modify AI Procurement Recommendations" : "AI Procurement Recommendations"}
            </h2>
            {hasAnalysis && !isLoading && (
              <span className="status-badge healthy" style={{ fontSize: "0.7rem", padding: "2px 8px" }}>
                {isEditing ? "Edit Mode" : "Generated"}
              </span>
            )}
          </div>

          {isLoading ? (
            /* Render Skeleton Loader while Analysis runs */
            renderSkeletonLoader()
          ) : !hasAnalysis ? (
            /* Idle Placeholder state */
            <div className="placeholder-card empty-state">
              <div className="placeholder-icon-wrap">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="36" 
                  height="36" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="20" x2="18" y2="10"></line>
                  <line x1="12" y1="20" x2="12" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="14"></line>
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
              </div>
              <p className="placeholder-text">Run an inventory analysis to receive AI procurement recommendations.</p>
            </div>
          ) : (
            /* Standard Recommendations Table */
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }} className="animate-fade-in">
              <div className="table-wrapper rec-table-wrapper">
                <table className="inventory-table rec-table">
                  <thead>
                    <tr>
                      <th style={{ width: "100px" }}>Priority</th>
                      <th>Product</th>
                      <th style={{ width: "170px" }}>Suggested Qty</th>
                      <th>Supplier</th>
                      <th style={{ width: "110px" }}>Est. Cost</th>
                      <th style={{ width: "35%" }}>Reasoning / Context</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(isEditing ? tempRecs : recs).map((rec) => {
                      const badgeClass = rec.priority.replace(/\s+/g, "").toLowerCase();
                      const estCost = rec.suggestedQuantity * rec.unitPrice;
                      return (
                        <tr key={rec.sku}>
                          <td>
                            <span className={`status-badge ${badgeClass}`} style={{ fontSize: "0.65rem", padding: "3px 8px" }}>
                              {rec.priority}
                            </span>
                          </td>
                          <td>
                            <div className="table-product-cell">
                              <span className="table-product-name">{rec.product}</span>
                              <span className="table-product-sku">{rec.sku}</span>
                            </div>
                          </td>
                          <td>
                            {isEditing ? (
                              /* Custom Inline Qty adjusting buttons */
                              <div className="qty-adjuster-wrap">
                                <button
                                  type="button"
                                  className="btn-qty-adj dec"
                                  onClick={() => handleQuantityChange(rec.sku, rec.suggestedQuantity - 10)}
                                  aria-label="Decrease quantity by 10"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                  </svg>
                                </button>
                                
                                <input
                                  type="number"
                                  className="rec-qty-input-field"
                                  value={rec.suggestedQuantity}
                                  min="0"
                                  onChange={(e) => handleQuantityChange(rec.sku, parseInt(e.target.value) || 0)}
                                />

                                <button
                                  type="button"
                                  className="btn-qty-adj inc"
                                  onClick={() => handleQuantityChange(rec.sku, rec.suggestedQuantity + 10)}
                                  aria-label="Increase quantity by 10"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                  </svg>
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontWeight: 600 }}>{rec.suggestedQuantity} units</span>
                            )}
                          </td>
                          <td>{rec.supplier}</td>
                          <td style={{ color: "var(--success-text)", fontWeight: 700 }}>
                            ${estCost.toFixed(2)}
                          </td>
                          <td>
                            <p className="rec-table-reasoning">{rec.reasoning}</p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons at the Bottom of the Table */}
              <div className="rec-global-actions">
                {isEditing ? (
                  <>
                    <button className="btn-rec-global save" onClick={handleSaveChangesClick}>
                      Save Changes
                    </button>
                    <button className="btn-rec-global cancel" onClick={handleCancelChanges}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button className="btn-rec-global approve-all" onClick={handleApproveAll}>
                      Approve All POs
                    </button>
                    <button className="btn-rec-global modify-all" onClick={handleStartModify}>
                      Modify Quantities
                    </button>
                    <button className="btn-rec-global reject-all" onClick={handleRejectAll}>
                      Reject All
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Under-Order Warning Modal Dialog */}
      {showWarningModal && (
        <div className="modal-overlay" style={{ zIndex: 3000 }}>
          <div className="modal-content animate-scale-in" style={{ maxWidth: "480px" }}>
            <div className="modal-icon-container" style={{ backgroundColor: "var(--warning-bg)", color: "var(--warning)" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <h3 className="modal-title">Low Stock Warning Alert</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: "12px 0 20px", textAlign: "center" }}>
              {warningMessage}
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button 
                className="btn-rec-global cancel" 
                onClick={() => setShowWarningModal(false)}
                style={{ padding: "10px 20px" }}
              >
                Update Recommendation
              </button>
              <button 
                className="btn-rec-global save" 
                onClick={handleProceedWarningAnyway}
                style={{ padding: "10px 20px", backgroundColor: "var(--warning)" }}
              >
                Proceed Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject All Confirmation Modal */}
      {showRejectModal && (
        <div className="modal-overlay" style={{ zIndex: 3000 }}>
          <div className="modal-content animate-scale-in" style={{ maxWidth: "460px" }}>
            <div className="modal-icon-container" style={{ backgroundColor: "var(--danger-bg)", color: "var(--danger)" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </div>
            <h3 className="modal-title" style={{ color: "var(--danger-text)" }}>Reject All Recommendations?</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: "12px 0 8px", textAlign: "center" }}>
              This will discard all <strong>{recs.length} AI-generated procurement recommendations</strong>. No purchase orders will be created and the analysis results will be cleared.
            </p>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "0 0 20px", textAlign: "center" }}>
              You can re-run the inventory analysis at any time to generate new recommendations.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button 
                className="btn-rec-global cancel" 
                onClick={() => setShowRejectModal(false)}
                style={{ padding: "10px 24px" }}
              >
                Go Back
              </button>
              <button 
                className="btn-rec-global reject-all" 
                onClick={handleConfirmReject}
                style={{ padding: "10px 24px" }}
              >
                Reject All POs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
