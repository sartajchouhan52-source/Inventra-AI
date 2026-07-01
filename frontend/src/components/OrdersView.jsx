import React, { useState } from "react";
import toast from "react-hot-toast";
import { validatePurchaseOrder } from '../utils/procurementValidator';

export default function OrdersView({ orders, setOrders, newOrderIds = [], onViewEmail }) {
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningDetails, setWarningDetails] = useState({ messages: [], onProceed: null });
  
  // Custom Draft PO state holding multiple product items
  const [draftItems, setDraftItems] = useState([
    { product: "Coca-Cola 500ml", quantity: 100, supplier: "ABC Distributors" }
  ]);
  
  const [formPriority, setFormPriority] = useState("Medium");
  const [formDelivery, setFormDelivery] = useState(
    new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );

  const productSuppliers = {
    "Coca-Cola 500ml": "ABC Distributors",
    "Lays Classic 150g": "ABC Distributors",
    "Amul Milk 1L": "Dairy Fresh",
    "Basmati Rice 5kg": "Grain Suppliers",
    "Maggi 2-Min 70g": "ABC Distributors",
    "White Eggs (30)": "Fresh Farms"
  };

  const unitPrices = {
    "Coca-Cola 500ml": 1.25,
    "Lays Classic 150g": 1.20,
    "Amul Milk 1L": 1.40,
    "Basmati Rice 5kg": 5.16,
    "Maggi 2-Min 70g": 0.85,
    "White Eggs (30)": 1.75
  };

  const handleAddItemRow = () => {
    setDraftItems((prev) => [
      ...prev,
      { product: "Coca-Cola 500ml", quantity: 100, supplier: "ABC Distributors" }
    ]);
  };

  const handleDeleteItemRow = (index) => {
    if (draftItems.length === 1) {
      toast.error("A purchase order must contain at least one product item.");
      return;
    }
    setDraftItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    setDraftItems((prev) =>
      prev.map((item, idx) => {
        if (idx === index) {
          const updated = { ...item, [field]: value };
          if (field === "product") {
            updated.supplier = productSuppliers[value] || "ABC Distributors";
          }
          return updated;
        }
        return item;
      })
    );
  };

  const createOrder = () => {
    let totalQty = 0;
    let totalCost = 0;
    const suppliers = [];
    const productsList = [];

    draftItems.forEach((item) => {
      totalQty += item.quantity;
      totalCost += item.quantity * (unitPrices[item.product] || 1.50);
      productsList.push(item.product);
      if (!suppliers.includes(item.supplier)) {
        suppliers.push(item.supplier);
      }
    });

    const productsSummary = productsList.length > 1 
      ? `${productsList[0]} (+ ${productsList.length - 1} more items)` 
      : productsList[0];

    const newPO = {
      poNumber: `PO-2026-M${orders.length + 1}`,
      product: productsSummary,
      supplier: suppliers.join(", "),
      date: new Date().toISOString().split("T")[0],
      quantity: totalQty,
      cost: totalCost,
      status: "Approved",
      eta: formDelivery,
      etaTime: "10:00 AM",
      type: "Manual Order"
    };

    setOrders((prev) => [newPO, ...prev]);
    setShowCustomModal(false);
    setDraftItems([{ product: "Coca-Cola 500ml", quantity: 100, supplier: "ABC Distributors" }]);
    toast.success(`Purchase Order ${newPO.poNumber} created for ${productsList.length} product(s).`);
  };

  const handleCreateOrder = (e) => {
    e.preventDefault();
    
    // Validate using procurement validator
    const supplierList = Object.values(productSuppliers);
    const validation = validatePurchaseOrder(draftItems, orders, 1000, supplierList);
    
    if (!validation.ok) {
      validation.errors.forEach(err => toast.error(err));
      return;
    }
    
    // Show warning dialog if there are warnings
    if (validation.warnings.length > 0) {
      setWarningDetails({
        messages: validation.warnings,
        onProceed: () => {
          setShowWarningModal(false);
          createOrder();
        }
      });
      setShowWarningModal(true);
      return;
    }
    
    createOrder();
  };

  const getStatusProgress = (status) => {
    switch (status) {
      case "Draft":
        return { percent: 10, color: "warning" };
      case "Pending Approval":
        return { percent: 20, color: "critical" };
      case "Approved":
        return { percent: 40, color: "primary-color" };
      case "Sent to Supplier":
        return { percent: 60, color: "warning" };
      case "In Transit":
        return { percent: 80, color: "in-transit" };
      case "Delivered":
      default:
        return { percent: 100, color: "healthy" };
    }
  };

  // Draft Management States
  const [showEditDraftModal, setShowEditDraftModal] = useState(false);
  const [editingDraft, setEditingDraft] = useState(null);
  const [editDraftQty, setEditDraftQty] = useState(100);
  const [editDraftSupplier, setEditDraftSupplier] = useState("");

  // Confirm/Authorize Draft PO
  const handleConfirmDraft = (draft) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.poNumber === draft.poNumber) {
          return {
            ...order,
            status: "Approved",
            type: "Approved Draft"
          };
        }
        return order;
      })
    );
    toast.success(`Purchase Order ${draft.poNumber} has been authorized and confirmed.`);
    if (onViewEmail) {
      onViewEmail({
        poNumber: draft.poNumber,
        product: draft.product,
        supplier: draft.supplier,
        quantity: draft.quantity,
        cost: draft.cost,
        eta: draft.eta || "5 days"
      });
    }
  };

  // Open Edit Draft Modal
  const handleOpenEditDraft = (draft) => {
    setEditingDraft(draft);
    setEditDraftQty(draft.quantity);
    setEditDraftSupplier(draft.supplier);
    setShowEditDraftModal(true);
  };

  // Save Edit Draft Changes
  const handleSaveEditDraft = (e) => {
    e.preventDefault();
    if (!editingDraft) return;

    // Calculate unit price or lookup
    const unitPrice = editingDraft.product.includes("Coca-Cola") ? 1.25 
                    : editingDraft.product.includes("Lays") ? 1.20 
                    : editingDraft.product.includes("Milk") ? 1.40 
                    : 1.50;

    setOrders((prev) =>
      prev.map((order) => {
        if (order.poNumber === editingDraft.poNumber) {
          return {
            ...order,
            quantity: editDraftQty,
            supplier: editDraftSupplier,
            cost: editDraftQty * unitPrice
          };
        }
        return order;
      })
    );

    setShowEditDraftModal(false);
    setEditingDraft(null);
    toast.success(`Draft PO ${editingDraft.poNumber} specifications updated.`);
  };

  // Discard Draft PO
  const handleDeleteDraft = (poNumber) => {
    if (confirm(`Are you sure you want to discard draft PO ${poNumber}?`)) {
      setOrders((prev) => prev.filter((order) => order.poNumber !== poNumber));
      toast(`Draft PO ${poNumber} discarded.`, {
        icon: "🗑️"
      });
    }
  };

  const drafts = orders.filter((o) => o.status === "Draft");
  const activeOrders = orders.filter((o) => o.status !== "Draft");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", paddingBottom: "80px" }}>
      <div className="section-header">
        <h2 className="section-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--primary)" }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
          </svg>
          Enterprise Procurement Orders
        </h2>
        <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          Total purchase logs: {activeOrders.length} orders
        </span>
      </div>

      {/* ── DRAFTED PURCHASE ORDERS ── */}
      {drafts.length > 0 && (
        <div className="inventory-section-card" style={{ borderLeft: "4px solid var(--warning)", padding: "20px" }} className="animate-fade-in">
          <h3 className="section-title" style={{ fontSize: "1.1rem", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--warning)" }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
            Drafted Purchase Orders ({drafts.length})
          </h3>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "16px" }}>
            These orders have been drafted from notification warnings. Confirm them to authorize active transmission.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {drafts.map((draft) => (
              <div key={draft.poNumber} className="draft-order-card animate-scale-in" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", border: "1px solid var(--border)", borderRadius: "12px", backgroundColor: "#fafbfc" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{draft.poNumber}</span>
                    <span className="status-badge warning" style={{ fontSize: "0.65rem", padding: "3px 8px" }}>Draft PO</span>
                  </div>
                  <div style={{ display: "flex", gap: "16px", fontSize: "0.8rem", color: "var(--text-secondary)", flexWrap: "wrap" }}>
                    <span><strong>Product:</strong> {draft.product}</span>
                    <span>•</span>
                    <span><strong>Supplier:</strong> {draft.supplier}</span>
                    <span>•</span>
                    <span><strong>Qty:</strong> {draft.quantity} units</span>
                    <span>•</span>
                    <span><strong>Est. Value:</strong> <strong style={{ color: "var(--success-text)", fontWeight: 700 }}>${draft.cost.toFixed(2)}</strong></span>
                  </div>
                </div>
                
                <div style={{ display: "flex", gap: "10px" }}>
                  <button 
                    onClick={() => handleConfirmDraft(draft)}
                    className="btn-rec-action approve"
                    style={{ padding: "8px 16px", borderRadius: "8px", fontSize: "0.8rem" }}
                  >
                    Confirm & Send
                  </button>
                  <button 
                    onClick={() => handleOpenEditDraft(draft)}
                    className="btn-rec-action modify"
                    style={{ padding: "8px 16px", borderRadius: "8px", fontSize: "0.8rem" }}
                  >
                    Edit Draft
                  </button>
                  <button 
                    onClick={() => handleDeleteDraft(draft.poNumber)}
                    className="btn-rec-action"
                    style={{ padding: "8px 16px", borderRadius: "8px", fontSize: "0.8rem", border: "1px solid var(--danger)", color: "var(--danger)" }}
                  >
                    Discard
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orders table list */}
      <div className="inventory-section-card">
        <div className="table-wrapper">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>PO ID</th>
                <th>Products Summary</th>
                <th>Type</th>
                <th>Supplier Partners</th>
                <th>Total Qty</th>
                <th>Total Value</th>
                <th>Order Date</th>
                <th>ETA Timeline</th>
                <th>Status Progress</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeOrders.map((order) => {
                const prog = getStatusProgress(order.status);
                const isNew = newOrderIds.includes(order.poNumber);
                return (
                  <tr key={order.poNumber} className={isNew ? "new-order-highlight" : ""}>
                    <td style={{ fontWeight: 700 }}>{order.poNumber}</td>
                    <td>{order.product}</td>
                    <td>
                      <span className={`status-badge ${order.type === "AI Order" ? "healthy" : "low"}`} style={{ fontSize: "0.6rem", padding: "2px 6px" }}>
                        {order.type}
                      </span>
                    </td>
                    <td>{order.supplier}</td>
                    <td style={{ fontWeight: 600 }}>{order.quantity.toLocaleString()} units</td>
                    <td style={{ fontWeight: 700, color: "var(--success-text)" }}>${order.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{order.date}</td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontWeight: 550 }}>{order.eta}</span>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{order.etaTime}</span>
                      </div>
                    </td>
                    <td style={{ minWidth: "150px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: 600 }}>
                          <span style={{ textTransform: "capitalize" }}>{order.status}</span>
                          <span style={{ color: "var(--text-secondary)" }}>{prog.percent}%</span>
                        </div>
                        <div style={{ height: "6px", width: "100%", backgroundColor: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                          <div 
                            className={`progress-fill-bar ${prog.color}`} 
                            style={{ height: "100%", width: `${prog.percent}%`, borderRadius: "3px", transition: "width 0.5s ease" }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        onClick={() => onViewEmail && onViewEmail({
                          poNumber: order.poNumber,
                          product: order.product,
                          supplier: order.supplier,
                          quantity: order.quantity,
                          cost: order.cost,
                          eta: order.eta
                        })}
                        className="btn-rec-action modify"
                        style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", borderRadius: "6px", padding: "4px 8px" }}
                        title="View dispatched supplier replenishment email"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                          <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                        Email
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Sticky Bottom Action Bar */}
      <div className="floating-action-bar">
        <div className="floating-action-bar-content centered">
          <button 
            onClick={() => setShowCustomModal(true)} 
            className="btn-primary"
            style={{ minWidth: "280px", margin: "0 auto" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            CREATE CUSTOM ORDER
          </button>
        </div>
      </div>

      {/* Multi-Product Custom PO Builder Modal */}
      {showCustomModal && (
        <div className="modal-overlay" onClick={() => setShowCustomModal(false)}>
          <div className="modal-content animate-scale-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "700px", textAlign: "left", alignItems: "stretch" }}>
            <div className="modal-icon-container" style={{ margin: "0 auto 12px", backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
            </div>
            <h3 className="modal-title" style={{ textAlign: "center", marginBottom: "16px" }}>Create Multi-Product Purchase Order</h3>
            
            <form onSubmit={handleCreateOrder} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              
              {/* Product Rows List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "250px", overflowY: "auto", paddingRight: "4px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)" }}>Items List ({draftItems.length})</span>
                {draftItems.map((item, index) => (
                  <div key={index} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <div style={{ flex: 2 }}>
                      <select 
                        value={item.product} 
                        onChange={(e) => handleItemChange(index, "product", e.target.value)}
                        className="rec-qty-input"
                        style={{ width: "100%", height: "38px" }}
                      >
                        <option value="Coca-Cola 500ml">Coca-Cola 500ml</option>
                        <option value="Lays Classic 150g">Lays Classic 150g</option>
                        <option value="Amul Milk 1L">Amul Milk 1L</option>
                        <option value="Basmati Rice 5kg">Basmati Rice 5kg</option>
                        <option value="Maggi 2-Min 70g">Maggi 2-Min 70g</option>
                        <option value="White Eggs (30)">White Eggs (30)</option>
                      </select>
                    </div>

                    <div style={{ flex: 1.2 }}>
                      <input 
                        type="text" 
                        value={item.supplier} 
                        disabled 
                        placeholder="Supplier"
                        className="rec-qty-input" 
                        style={{ width: "100%", height: "38px", backgroundColor: "#f1f5f9", fontSize: "0.8rem", cursor: "not-allowed" }}
                      />
                    </div>

                    <div style={{ flex: 1 }}>
                      <input 
                        type="number" 
                        value={item.quantity} 
                        min="1" 
                        onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value) || 0)}
                        className="rec-qty-input" 
                        style={{ width: "100%", height: "38px" }}
                      />
                    </div>

                    <button 
                      type="button" 
                      onClick={() => handleDeleteItemRow(index)}
                      className="btn-qty-adj"
                      style={{ border: "1px solid var(--border)", color: "var(--danger)" }}
                      aria-label="Remove item"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              <button 
                type="button" 
                className="status-badge healthy" 
                onClick={handleAddItemRow}
                style={{ alignSelf: "flex-start", cursor: "pointer", border: "1px solid var(--success)", backgroundColor: "white", padding: "6px 12px", fontSize: "0.8rem" }}
              >
                + Add Another Product
              </button>

              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Priority Label</label>
                  <select 
                    value={formPriority} 
                    onChange={(e) => setFormPriority(e.target.value)}
                    className="rec-qty-input" 
                    style={{ width: "100%", height: "40px" }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High Priority</option>
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Expected Delivery</label>
                  <input 
                    type="date" 
                    value={formDelivery} 
                    onChange={(e) => setFormDelivery(e.target.value)}
                    className="rec-qty-input" 
                    style={{ width: "100%", height: "40px" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "12px", justifyContent: "flex-end" }}>
                <button 
                  type="button" 
                  className="btn-rec-global cancel" 
                  onClick={() => setShowCustomModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-rec-global save"
                >
                  Transmit PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Validation Warning Modal */}
      {showWarningModal && (
        <div className="modal-overlay" style={{ zIndex: 3000 }}>
          <div className="modal-content animate-scale-in" style={{ maxWidth: "520px" }}>
            <div className="modal-icon-container" style={{ backgroundColor: "var(--warning-bg)", color: "var(--warning)" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <h3 className="modal-title">Procurement Warning</h3>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: "12px 0 20px", textAlign: "left", width: "100%" }}>
              {warningDetails.messages.map((msg, i) => (
                <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "8px", padding: "8px 12px", backgroundColor: "var(--warning-bg)", borderRadius: "8px", border: "1px solid rgba(245, 158, 11, 0.15)" }}>
                  <span style={{ color: "var(--warning)", fontWeight: 700, flexShrink: 0 }}>⚠</span>
                  <span>{msg}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", width: "100%" }}>
              <button 
                className="btn-rec-global cancel" 
                onClick={() => setShowWarningModal(false)}
                style={{ padding: "10px 20px" }}
              >
                Modify Quantities
              </button>
              <button 
                className="btn-rec-global save" 
                onClick={warningDetails.onProceed}
                style={{ padding: "10px 20px", backgroundColor: "var(--warning)" }}
              >
                Proceed Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Draft Modal */}
      {showEditDraftModal && editingDraft && (
        <div className="modal-overlay" onClick={() => setShowEditDraftModal(false)}>
          <div className="modal-content animate-scale-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
            <div className="modal-icon-container" style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </div>
            <h3 className="modal-title">Edit Draft Purchase Order</h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", textAlign: "center", marginBottom: "16px" }}>
              Modify specifications for draft PO {editingDraft.poNumber}.
            </p>
            
            <form onSubmit={handleSaveEditDraft} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Product Name</label>
                <input 
                  type="text" 
                  value={editingDraft.product} 
                  disabled
                  className="rec-qty-input"
                  style={{ width: "100%", height: "40px", backgroundColor: "#f1f5f9", cursor: "not-allowed" }}
                />
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Supplier Partner</label>
                  <select 
                    value={editDraftSupplier} 
                    onChange={(e) => setEditDraftSupplier(e.target.value)}
                    className="rec-qty-input"
                    style={{ width: "100%", height: "40px" }}
                  >
                    <option value="ABC Distributors">ABC Distributors</option>
                    <option value="Dairy Fresh">Dairy Fresh</option>
                    <option value="Grain Suppliers">Grain Suppliers</option>
                    <option value="Fresh Farms">Fresh Farms</option>
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Draft Quantity (units)</label>
                  <input 
                    type="number" 
                    value={editDraftQty} 
                    min="1"
                    onChange={(e) => setEditDraftQty(parseInt(e.target.value) || 0)}
                    className="rec-qty-input"
                    style={{ width: "100%", height: "40px" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "12px" }}>
                <button type="button" className="btn-rec-global cancel" onClick={() => setShowEditDraftModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-rec-global save">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
