import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import TopNav from "./components/TopNav";
import DashboardView from "./components/DashboardView";
import SearchableInventory from "./components/SearchableInventory";
import RecentAlerts from "./components/RecentAlerts";

// Import functional modules
import Analytics from "./components/Analytics";
import AlertsView from "./components/AlertsView";
import OrdersView from "./components/OrdersView";
import DeliveriesView from "./components/DeliveriesView";
import SettingsView from "./components/SettingsView";

import { Toaster } from 'react-hot-toast';

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return sessionStorage.getItem("isSidebarCollapsed") === "true";
  });
  const [isAlertsDrawerOpen, setIsAlertsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasAnalysis, setHasAnalysis] = useState(false);

  // Security Alert State
  const [showSecurityAlert, setShowSecurityAlert] = useState(false);
  const [securityMessage, setSecurityMessage] = useState("");

  // Track newly created PO IDs for highlight animation
  const [newOrderIds, setNewOrderIds] = useState([]);

  // Global State for Purchase Orders
  const [orders, setOrders] = useState([
    { poNumber: "PO-2026-001", product: "Amul Milk 1L", supplier: "Dairy Fresh", date: "2026-06-25", quantity: 60, cost: 84.00, status: "In Transit", eta: "2026-06-28", etaTime: "10:30 AM", type: "AI Order" },
    { poNumber: "PO-2026-002", product: "Lays Classic 150g", supplier: "ABC Distributors", date: "2026-06-24", quantity: 120, cost: 144.00, status: "Sent to Supplier", eta: "2026-06-29", etaTime: "02:00 PM", type: "AI Order" },
    { poNumber: "PO-2026-003", product: "Basmati Rice 5kg", supplier: "Grain Suppliers", date: "2026-06-20", quantity: 80, cost: 620.00, status: "Delivered", eta: "2026-06-23", etaTime: "11:00 AM", type: "AI Order" },
    { poNumber: "PO-2026-004", product: "White Eggs (30)", supplier: "Fresh Farms", date: "2026-06-18", quantity: 200, cost: 350.00, status: "Delivered", eta: "2026-06-21", etaTime: "09:15 AM", type: "Manual Order" }
  ]);

  // Global State for the recently approved PO Success Card
  const [approvedPOInfo, setApprovedPOInfo] = useState(null);

  // Global State for viewing sent email
  const [viewingEmailInfo, setViewingEmailInfo] = useState(null);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleToggleCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      sessionStorage.setItem("isSidebarCollapsed", String(next));
      return next;
    });
  };

  const toggleAlertsDrawer = () => {
    setIsAlertsDrawerOpen((prev) => !prev);
  };

  const closeAlertsDrawer = () => {
    setIsAlertsDrawerOpen(false);
  };

  // Navigate to Alerts tab and close the notification drawer
  const handleViewAllAlerts = () => {
    setActivePage("alerts");
    setIsAlertsDrawerOpen(false);
  };

  // Lock body scroll when alerts drawer or email viewer is open
  useEffect(() => {
    if (isAlertsDrawerOpen || viewingEmailInfo) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isAlertsDrawerOpen, !!viewingEmailInfo]);

  const handleAnalyzeClick = () => {
    setIsLoading(true);
    setProgress(0);
    setHasAnalysis(false);
    setApprovedPOInfo(null);
  };

  // Handle simulated progress bar loading over 2 seconds (2000ms)
  useEffect(() => {
    let interval = null;
    if (isLoading) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsLoading(false);
            setHasAnalysis(true);
            return 100;
          }
          return Math.min(100, prev + Math.floor(Math.random() * 10) + 8);
        });
      }, 150);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading]);

  // Clear new order highlights after 3 seconds
  useEffect(() => {
    if (newOrderIds.length > 0) {
      const timer = setTimeout(() => setNewOrderIds([]), 3000);
      return () => clearTimeout(timer);
    }
  }, [newOrderIds]);

  // Approve Recommendations and add to global Orders list
  const handleApprovePO = (approvedItems) => {
    const newPOList = [];
    let totalQty = 0;
    let totalCost = 0;
    const suppliers = [];

    approvedItems.forEach((item, index) => {
      const poNum = `PO-2026-10${orders.length + index + 1}`;
      const itemCost = item.suggestedQuantity * item.unitPrice;
      totalQty += item.suggestedQuantity;
      totalCost += itemCost;
      if (!suppliers.includes(item.supplier)) {
        suppliers.push(item.supplier);
      }

      newPOList.push({
        poNumber: poNum,
        product: item.product,
        supplier: item.supplier,
        date: new Date().toISOString().split("T")[0],
        quantity: item.suggestedQuantity,
        cost: itemCost,
        status: "Approved",
        eta: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        etaTime: "11:30 AM",
        type: "AI Order"
      });
    });

    setOrders((prev) => [...newPOList, ...prev]);
    setNewOrderIds(newPOList.map(o => o.poNumber));

    // Save info for rendering the Success PO Card
    setApprovedPOInfo({
      poNumber: newPOList.map(o => o.poNumber).join(", "),
      supplier: suppliers.join(" & "),
      quantity: totalQty,
      cost: totalCost
    });
  };

  // Reject Recommendations (returns panel to idle state)
  const handleRejectRecommendations = () => {
    setHasAnalysis(false);
    setApprovedPOInfo(null);
  };

  // Switch tabs (used by PO Success Card button)
  const handleGoToOrders = () => {
    setActivePage("orders");
    setApprovedPOInfo(null);
    setHasAnalysis(false);
  };

  // Intercepting E2E UI actions for security injection validations
  const checkPromptSecurity = (input) => {
    const injectionPatterns = /ignore|script|select|insert|union/i;
    if (injectionPatterns.test(input)) {
      setSecurityMessage("Security Alert: Malicious prompt patterns or unauthorized query injections detected. Transaction terminated to preserve system integrity.");
      setShowSecurityAlert(true);
      return false;
    }
    return true;
  };

  // Render view components dynamically based on active navigation page
  const renderMainContent = () => {
    switch (activePage) {
      case "dashboard":
        return (
          <DashboardView 
            orders={orders}
            hasAnalysis={hasAnalysis}
            isLoading={isLoading}
            approvedPOInfo={approvedPOInfo}
            onApprove={handleApprovePO}
            onReject={handleRejectRecommendations}
            onGoToOrders={handleGoToOrders}
            onNavigate={(page) => setActivePage(page)}
            onViewEmail={(info) => setViewingEmailInfo(info)}
          />
        );
      case "inventory":
        return <SearchableInventory />;
      case "analytics":
        return (
          <div className="animate-fade-in">
            <Analytics />
          </div>
        );
      case "alerts":
        return (
          <div className="animate-fade-in">
            <AlertsView orders={orders} setOrders={setOrders} onNavigate={(page) => setActivePage(page)} />
          </div>
        );
      case "orders":
        return (
          <div className="animate-fade-in">
            <OrdersView orders={orders} setOrders={setOrders} newOrderIds={newOrderIds} onViewEmail={(info) => setViewingEmailInfo(info)} />
          </div>
        );
      case "deliveries":
        return (
          <div className="animate-fade-in">
            <DeliveriesView orders={orders} />
          </div>
        );
      case "settings":
        return (
          <div className="animate-fade-in">
            <SettingsView />
          </div>
        );
      default:
        return <div style={{ padding: "40px", textAlign: "center" }}>Page under construction</div>;
    }
  };

  return (
    <div className={`app-container ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 4000,
          style: { fontFamily: 'var(--font-sans)', fontSize: '0.9rem', borderRadius: '12px', padding: '14px 20px' },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      {/* Left Sidebar Navigation */}
      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        isSidebarOpen={isSidebarOpen}
        onCloseSidebar={closeSidebar}
        isCollapsed={isSidebarCollapsed}
      />

      {/* Main Content Area Wrapper */}
      <div className="main-wrapper">
        {/* Top Navbar */}
        <TopNav 
          onToggleSidebar={toggleSidebar} 
          isSidebarOpen={isSidebarOpen} 
          onToggleAlerts={toggleAlertsDrawer}
          onToggleCollapse={handleToggleCollapse}
          isCollapsed={isSidebarCollapsed}
        />

        {/* Dashboard View Routing */}
        <div className="dashboard-scroll-container">
          <main className="content-area">
            {renderMainContent()}
          </main>

          {/* Floating Sticky Bottom Action Bar with Embedded Progress Analyze Button */}
          {activePage === "dashboard" && (
            <div className="floating-action-bar">
              <div className="floating-action-bar-content centered">
                <button 
                  onClick={handleAnalyzeClick} 
                  className="btn-primary btn-analyze"
                  disabled={isLoading}
                  style={{ position: "relative", overflow: "hidden", margin: "0 auto", display: "flex", minWidth: "280px" }}
                >
                  {/* Progress bar overlay fill embedded inside the button */}
                  {isLoading && (
                    <div 
                      className="btn-progress-fill" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  )}

                  {/* Label sits on top of progress bar fill */}
                  <span style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", gap: "10px", margin: "auto" }}>
                    {isLoading ? (
                      <>
                        <span className="button-spinner"></span>
                        ANALYZING... {progress}%
                      </>
                    ) : (
                      <>
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
                        >
                          <line x1="18" y1="20" x2="18" y2="10"></line>
                          <line x1="12" y1="20" x2="12" y2="4"></line>
                          <line x1="6" y1="20" x2="6" y2="14"></line>
                        </svg>
                        ANALYZE INVENTORY
                      </>
                    )}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sliding Alerts Drawer Overlay on the Right side */}
      <div className={`alerts-drawer-overlay ${isAlertsDrawerOpen ? "open" : ""}`} onClick={closeAlertsDrawer}>
        <div className="alerts-drawer-content" onClick={(e) => e.stopPropagation()} onWheel={(e) => e.stopPropagation()}>
          <div className="alerts-drawer-header">
            <h3 className="alerts-drawer-title">Notifications</h3>
            <button className="alerts-drawer-close" onClick={closeAlertsDrawer} aria-label="Close alerts panel">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div className="alerts-drawer-body">
            <RecentAlerts onViewAll={handleViewAllAlerts} />
          </div>
        </div>
      </div>

      {/* Security Override Alert Screen */}
      {showSecurityAlert && (
        <div className="modal-overlay" style={{ zIndex: 4000, backgroundColor: "rgba(15, 23, 42, 0.85)" }}>
          <div className="modal-content animate-scale-in" style={{ maxWidth: "500px", border: "1px solid var(--danger)", borderTop: "4px solid var(--danger)" }}>
            <div className="modal-icon-container" style={{ backgroundColor: "var(--danger-bg)", color: "var(--danger)" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <h3 className="modal-title" style={{ color: "var(--danger-text)" }}>Security Exception</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: "12px 0 20px", textAlign: "center" }}>
              {securityMessage}
            </p>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <button 
                className="btn-rec-global cancel" 
                onClick={() => setShowSecurityAlert(false)}
                style={{ padding: "10px 30px", border: "1px solid var(--danger)", color: "var(--danger)", backgroundColor: "white" }}
              >
                Acknowledge & Reset
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── GLOBAL SENT EMAIL VIEWER MODAL ── */}
      {viewingEmailInfo && (
        <div className="modal-overlay" style={{ zIndex: 4000, backgroundColor: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)", overscrollBehavior: "contain" }} onClick={() => setViewingEmailInfo(null)}>
          <div className="modal-content animate-scale-in" onClick={(e) => e.stopPropagation()} onWheel={(e) => e.stopPropagation()} style={{ maxWidth: "600px", borderRadius: "16px", padding: "0", border: "1px solid var(--border)", overflow: "hidden", boxShadow: "var(--shadow-premium)", backgroundColor: "white", overscrollBehavior: "contain" }}>
            {/* Email Header bar */}
            <div style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid var(--border)", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "38px", height: "38px", borderRadius: "10px", backgroundColor: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </div>
                <div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>Dispatched Order Email</h3>
                  <span style={{ fontSize: "0.75rem", color: "var(--success-text)", display: "flex", alignItems: "center", gap: "4px", fontWeight: 650 }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--success)", display: "inline-block" }}></span>
                    Sent via Agent Automated Replenishment
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setViewingEmailInfo(null)}
                style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "50%" }}
                className="alerts-drawer-close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Email Metadata */}
            <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.85rem", backgroundColor: "#ffffff" }}>
              <div style={{ display: "flex", alignItems: "baseline" }}>
                <span style={{ color: "var(--text-muted)", width: "70px", flexShrink: 0, fontWeight: 550 }}>From:</span>
                <span style={{ color: "var(--text-primary)" }}><strong>Inventra AI Replenishment Agent</strong> &lt;procurement@inventra.ai&gt;</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline" }}>
                <span style={{ color: "var(--text-muted)", width: "70px", flexShrink: 0, fontWeight: 550 }}>To:</span>
                <span style={{ color: "var(--text-primary)" }}><strong>{viewingEmailInfo.supplier} Sales Team</strong> &lt;sales@{viewingEmailInfo.supplier?.toLowerCase()?.replace(/\s+/g, '') || "supplier"}.com&gt;</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline" }}>
                <span style={{ color: "var(--text-muted)", width: "70px", flexShrink: 0, fontWeight: 550 }}>Subject:</span>
                <span style={{ color: "var(--text-primary)", fontWeight: 650 }}>[URGENT] Replenishment Purchase Order Dispatched: {viewingEmailInfo.poNumber}</span>
              </div>
            </div>

            {/* Email Body */}
            <div style={{ padding: "24px 28px", minHeight: "220px", fontSize: "0.88rem", lineHeight: "1.6", color: "var(--text-primary)", backgroundColor: "#ffffff", overflowY: "auto", maxHeight: "300px" }}>
              <p style={{ marginBottom: "16px" }}>Dear Sales Team,</p>
              
              <p style={{ marginBottom: "16px" }}>
                Please find attached the formalized Purchase Order <strong>{viewingEmailInfo.poNumber}</strong> generated automatically by our Inventra AI replenishment engine for:
              </p>

              <div style={{ backgroundColor: "#f8fafc", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px 20px", marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", paddingBottom: "8px", borderBottom: "1px dashed var(--border)" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Item Description:</span>
                  <strong style={{ color: "var(--text-primary)" }}>{viewingEmailInfo.product}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", paddingBottom: "8px", borderBottom: "1px dashed var(--border)" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Order Quantity:</span>
                  <strong style={{ color: "var(--text-primary)" }}>{viewingEmailInfo.quantity?.toLocaleString()} units</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Est. Replenishment Outlay:</span>
                  <strong style={{ color: "var(--success-text)", fontWeight: 700 }}>${viewingEmailInfo.cost?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</strong>
                </div>
              </div>

              <p style={{ marginBottom: "16px" }}>
                Please confirm receipt of this order and reply directly to this thread with your delivery confirmation to coordinate matching expected delivery timeline (<strong>{viewingEmailInfo.eta || "3 days"}</strong>).
              </p>

              <p style={{ marginTop: "28px", color: "var(--text-secondary)", borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
                Best regards,<br />
                <strong>Inventra AI Replenishment Bot</strong><br />
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Chicago Central Hub Logistics Terminal</span>
              </p>
            </div>

            {/* Email Footer bar */}
            <div style={{ backgroundColor: "#f8fafc", borderTop: "1px solid var(--border)", padding: "16px 24px", display: "flex", justifyContent: "flex-end" }}>
              <button 
                className="btn-rec-global cancel" 
                onClick={() => setViewingEmailInfo(null)}
                style={{ padding: "10px 28px", fontSize: "0.88rem", display: "flex", alignItems: "center", gap: "6px" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export { App };
