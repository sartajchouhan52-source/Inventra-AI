import React from "react";
import toast from "react-hot-toast";

export default function TopNav({ onToggleSidebar, isSidebarOpen, onToggleAlerts, onToggleCollapse, isCollapsed }) {
  const handleHamburgerClick = () => {
    if (window.innerWidth < 768) {
      onToggleSidebar();
    } else {
      onToggleCollapse();
    }
  };

  return (
    <nav className="top-nav">
      <div style={{ display: "flex", alignItems: "center" }}>
        {/* Animated Hamburger Button */}
        <button 
          className={`hamburger-btn ${isCollapsed ? "" : "active"}`}
          onClick={handleHamburgerClick}
          aria-label="Toggle Sidebar"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className="top-nav-left">
          <div className="top-nav-brand">
            <h1 className="top-nav-title">Inventra AI</h1>
            <span className="status-badge healthy" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>Enterprise</span>
          </div>
          <span className="top-nav-subtitle">AI Inventory & Procurement Assistant</span>
        </div>

        {/* Enterprise Warehouse Selector */}
        <div className="location-selector-wrap" style={{ display: "flex", alignItems: "center", marginLeft: "24px", paddingLeft: "16px", borderLeft: "1px solid var(--border)" }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--primary)", marginRight: "6px", flexShrink: 0 }}>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <select 
            className="location-select-dropdown" 
            style={{ 
              border: "none", 
              background: "none", 
              fontSize: "0.85rem", 
              fontWeight: 700, 
              color: "var(--text-primary)", 
              cursor: "pointer",
              outline: "none",
              paddingRight: "8px",
              fontFamily: "var(--font-sans)"
            }}
            onChange={(e) => toast.success(`Switched to: ${e.target.options[e.target.selectedIndex].text}`)}
          >
            <option value="chicago">Chicago Central Hub</option>
            <option value="newyork">NY Distribution Depot</option>
            <option value="sanfran">West Coast Logistics Hub</option>
          </select>
        </div>
      </div>

      <div className="top-nav-right">
        {/* Bell Icon - Toggles the Recent Alerts sliding drawer */}
        <button className="icon-button" aria-label="Notifications" onClick={onToggleAlerts}>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          <span className="icon-badge"></span>
        </button>

        <div className="user-profile-trigger" style={{ marginLeft: "8px" }}>
          <div className="user-avatar-small">JD</div>
          <span className="user-name-small user-name" style={{ color: "var(--text-primary)" }}>John Doe</span>
        </div>
      </div>
    </nav>
  );
}
