import React from "react";

export default function DeliveriesView({ orders }) {
  // Filter for approved, sent, transit, or delivered orders
  const activeDeliveries = orders.filter(
    (o) => o.status !== "Pending Approval"
  );

  // Generate a mock countdown based on status
  const getDeliveryCountdown = (status) => {
    switch (status) {
      case "Approved":
        return "Scheduled (Arriving in 3 days)";
      case "Sent to Supplier":
        return "Processing (Arriving in 2 days)";
      case "In Transit":
        return "In Transit (14 hours remaining)";
      case "Delivered":
      default:
        return "Delivered (Arrived)";
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="section-header">
        <h2 className="section-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--primary)" }}>
            <rect x="1" y="3" width="15" height="13"></rect>
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
            <circle cx="5.5" cy="18.5" r="2.5"></circle>
            <circle cx="18.5" cy="18.5" r="2.5"></circle>
          </svg>
          Active Logistics & Shipments
        </h2>
        <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          {activeDeliveries.filter(d => d.status !== "Delivered").length} active transit tracks
        </span>
      </div>

      {/* Deliveries list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {activeDeliveries.length > 0 ? (
          activeDeliveries.map((delivery) => {
            let statusColor = "lowstock";
            if (delivery.status === "Delivered") statusColor = "healthy";
            if (delivery.status === "In Transit") statusColor = "low";

            return (
              <div key={delivery.poNumber} className="inventory-section-card animate-fade-in" style={{ padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "16px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>{delivery.supplier}</span>
                      <span className={`status-badge ${statusColor}`} style={{ fontSize: "0.65rem" }}>{delivery.status}</span>
                      <span className="status-badge healthy" style={{ fontSize: "0.6rem", padding: "2px 6px" }}>
                        {delivery.type}
                      </span>
                    </div>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px", display: "block" }}>
                      PO ID: <strong>{delivery.poNumber}</strong> | Product: {delivery.product} ({delivery.quantity} units)
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block" }}>ETA Status</span>
                    <span style={{ fontSize: "1rem", fontWeight: 700, color: "var(--primary)" }}>
                      {getDeliveryCountdown(delivery.status)}
                    </span>
                  </div>
                </div>

                {/* Graphical Transit Line */}
                <div style={{ padding: "16px 0", borderTop: "1px dashed var(--border)", borderBottom: "1px dashed var(--border)", margin: "16px 0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
                    {/* Progress Bar background Line */}
                    <div style={{ 
                      position: "absolute", 
                      top: "16px", 
                      left: "5%", 
                      right: "5%", 
                      height: "4px", 
                      backgroundColor: "#e2e8f0", 
                      zIndex: 1 
                    }}>
                      <div style={{ 
                        height: "100%", 
                        width: delivery.status === "Delivered" ? "100%" : delivery.status === "In Transit" ? "66%" : delivery.status === "Sent to Supplier" ? "33%" : "10%", 
                        backgroundColor: "var(--primary)" 
                      }}></div>
                    </div>

                    {/* Timeline Checkpoints */}
                    {["Approved", "Sent to Supplier", "In Transit", "Delivered"].map((step, idx) => {
                      let done = false;
                      if (delivery.status === "Delivered") done = true;
                      else if (delivery.status === "In Transit" && idx <= 2) done = true;
                      else if (delivery.status === "Sent to Supplier" && idx <= 1) done = true;
                      else if (idx === 0) done = true;

                      return (
                        <div key={step} style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 2, position: "relative" }}>
                          <div style={{ 
                            width: "32px", 
                            height: "32px", 
                            borderRadius: "50%", 
                            backgroundColor: done ? "var(--primary)" : "white", 
                            border: done ? "none" : "2px solid #e2e8f0", 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center",
                            color: done ? "white" : "var(--text-muted)",
                            boxShadow: done ? "0 2px 5px rgba(79, 70, 229, 0.25)" : "none"
                          }}>
                            {done ? (
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            ) : idx + 1}
                          </div>
                          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: done ? "var(--text-primary)" : "var(--text-muted)", marginTop: "8px" }}>
                            {step}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", color: "var(--text-secondary)", flexWrap: "wrap", gap: "10px" }}>
                  <span>Est. Arrival: <strong>{delivery.eta}</strong> at <strong>{delivery.etaTime}</strong></span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="placeholder-card empty-state">
            <div className="placeholder-icon-wrap" style={{ backgroundColor: "#f1f5f9", color: "var(--text-secondary)" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13"></rect>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
              </svg>
            </div>
            <p className="placeholder-text">No active shipments in transit at this time.</p>
          </div>
        )}
      </div>
    </div>
  );
}
