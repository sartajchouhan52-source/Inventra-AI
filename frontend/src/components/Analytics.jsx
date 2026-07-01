import React from "react";

export default function Analytics() {
  const stockDistribution = [
    { category: "Beverages", percentage: 35, count: "15,011", color: "#4f46e5" },
    { category: "Dairy", percentage: 25, count: "10,722", color: "#10b981" },
    { category: "Snacks", percentage: 15, count: "6,433", color: "#f59e0b" },
    { category: "Staples", percentage: 15, count: "6,433", color: "#a78bfa" },
    { category: "Produce", percentage: 10, count: "4,289", color: "#ef4444" }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="section-header">
        <h2 className="section-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--primary)" }}>
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
          Inventory Analytics
        </h2>
        <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Period: Last 30 Days</span>
      </div>

      {/* Analytics KPI row */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-details">
            <span className="kpi-label">Stock Turnover</span>
            <span className="kpi-value">6.8x</span>
            <span className="kpi-change-row positive">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
              +0.4x vs last Q
            </span>
          </div>
          <div className="kpi-icon-container">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-details">
            <span className="kpi-label">Waste Rate</span>
            <span className="kpi-value">1.2%</span>
            <span className="kpi-change-row positive">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
              -0.3% this month
            </span>
          </div>
          <div className="kpi-icon-container" style={{ backgroundColor: "var(--success-bg)", color: "var(--success)" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-details">
            <span className="kpi-label">Supplier SLA</span>
            <span className="kpi-value">98.4%</span>
            <span className="kpi-change-row positive">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
              +1.2% this week
            </span>
          </div>
          <div className="kpi-icon-container" style={{ backgroundColor: "var(--warning-bg)", color: "var(--warning)" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-details">
            <span className="kpi-label">Carrying Costs</span>
            <span className="kpi-value">$245k</span>
            <span className="kpi-change-row neutral">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Stable carrying margin
            </span>
          </div>
          <div className="kpi-icon-container" style={{ backgroundColor: "rgba(167, 139, 250, 0.15)", color: "#a78bfa" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          </div>
        </div>
      </div>

      {/* Charts and Data tables layout */}
      <div className="dashboard-body-grid">
        {/* Left chart panel */}
        <div className="inventory-section-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <h3 className="section-title" style={{ fontSize: "1.1rem" }}>Stock Level & Safety Margins</h3>
          
          {/* Custom SVG Bar Chart */}
          <div style={{ height: "240px", width: "100%", position: "relative", marginTop: "16px" }}>
            <svg viewBox="0 0 500 200" style={{ width: "100%", height: "100%" }}>
              {/* Grid Lines */}
              <line x1="40" y1="30" x2="480" y2="30" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="80" x2="480" y2="80" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="130" x2="480" y2="130" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="180" x2="480" y2="180" stroke="#e2e8f0" strokeWidth="1.5" />
              
              {/* Y Axis Labels */}
              <text x="15" y="34" fontSize="10" fill="#94a3b8" textAnchor="middle">15k</text>
              <text x="15" y="84" fontSize="10" fill="#94a3b8" textAnchor="middle">10k</text>
              <text x="15" y="134" fontSize="10" fill="#94a3b8" textAnchor="middle">5k</text>
              <text x="15" y="184" fontSize="10" fill="#94a3b8" textAnchor="middle">0</text>

              {/* Bars */}
              {/* Beverages (Height 150) */}
              <rect x="60" y="70" width="35" height="110" rx="4" fill="rgba(79, 70, 229, 0.8)" />
              {/* Dairy (Height 90) */}
              <rect x="140" y="100" width="35" height="80" rx="4" fill="rgba(16, 185, 129, 0.8)" />
              {/* Snacks (Height 40) */}
              <rect x="220" y="150" width="35" height="30" rx="4" fill="rgba(245, 158, 11, 0.8)" />
              {/* Staples (Height 170) */}
              <rect x="300" y="45" width="35" height="135" rx="4" fill="rgba(167, 139, 250, 0.8)" />
              {/* Produce (Height 30) */}
              <rect x="380" y="160" width="35" height="20" rx="4" fill="rgba(239, 68, 68, 0.8)" />

              {/* X Axis Labels */}
              <text x="77.5" y="195" fontSize="10" fill="#64748b" textAnchor="middle">Beverages</text>
              <text x="157.5" y="195" fontSize="10" fill="#64748b" textAnchor="middle">Dairy</text>
              <text x="237.5" y="195" fontSize="10" fill="#64748b" textAnchor="middle">Snacks</text>
              <text x="317.5" y="195" fontSize="10" fill="#64748b" textAnchor="middle">Staples</text>
              <text x="397.5" y="195" fontSize="10" fill="#64748b" textAnchor="middle">Produce</text>
            </svg>
          </div>
        </div>

        {/* Right side Distribution panel */}
        <div className="inventory-section-card" style={{ padding: "24px" }}>
          <h3 className="section-title" style={{ fontSize: "1.1rem", marginBottom: "16px" }}>Category Allocation</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {stockDistribution.map((cat) => (
              <div key={cat.category} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: 550 }}>
                  <span>{cat.category}</span>
                  <span style={{ color: "var(--text-secondary)" }}>{cat.percentage}% ({cat.count} items)</span>
                </div>
                <div style={{ height: "8px", width: "100%", backgroundColor: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${cat.percentage}%`, backgroundColor: cat.color, borderRadius: "4px" }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
