import React, { useState } from "react";

export default function SettingsView() {
  const [model, setModel] = useState("gemini-1.5-flash");
  const [safetyMargin, setSafetyMargin] = useState(20);
  const [useVertex, setUseVertex] = useState(false);
  const [apiUrl, setApiUrl] = useState("http://localhost:8080");

  const handleSave = (e) => {
    e.preventDefault();
    alert(`Success: System configurations saved!\nSelected Model: ${model}\nSafety Stock Margin: ${safetyMargin}%\nAPI Server: ${apiUrl}`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="section-header">
        <h2 className="section-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--primary)" }}>
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
          System Configurations
        </h2>
        <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Active Environment: Local Dev</span>
      </div>

      <div className="inventory-section-card" style={{ padding: "32px", maxWidth: "700px" }}>
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* AI Model settings */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)" }}>Gemini AI Model Selection</label>
            <select 
              value={model} 
              onChange={(e) => setModel(e.target.value)}
              className="rec-qty-input"
              style={{ width: "100%", height: "44px" }}
            >
              <option value="gemini-1.5-flash">Gemini 1.5 Flash (Medium / Default)</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro (Heavy reasoning)</option>
              <option value="gemini-2.0-flash">Gemini 2.0 Flash (Next-gen speed)</option>
            </select>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>We recommend Gemini 1.5 Flash for speed-sensitive catalog iterations.</span>
          </div>

          {/* Safety Stock levels */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)" }}>Safety Stock Buffer Margin (%)</label>
            <input 
              type="number" 
              value={safetyMargin} 
              onChange={(e) => setSafetyMargin(parseInt(e.target.value) || 0)}
              className="rec-qty-input"
              style={{ width: "100%", height: "44px" }}
            />
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Minimum stock buffer percentage before raising low-level warnings.</span>
          </div>

          {/* Vertex toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0" }}>
            <input 
              type="checkbox" 
              checked={useVertex} 
              id="vertex"
              onChange={(e) => setUseVertex(e.target.checked)}
              style={{ width: "18px", height: "18px", cursor: "pointer" }}
            />
            <label htmlFor="vertex" style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)", cursor: "pointer" }}>
              Enable Google Cloud Vertex AI SDK (Otherwise uses Gemini AI Studio)
            </label>
          </div>

          {/* Backend endpoint URL */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)" }}>Backend FastAPI URL Endpoint</label>
            <input 
              type="text" 
              value={apiUrl} 
              onChange={(e) => setApiUrl(e.target.value)}
              className="rec-qty-input"
              style={{ width: "100%", height: "44px" }}
            />
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>The location of the running FastAPI server executing the ADK workflow.</span>
          </div>

          {/* Submit */}
          <button type="submit" className="btn-primary" style={{ width: "max-content", marginTop: "12px", height: "48px", padding: "0 32px", borderRadius: "8px" }}>
            Save Configurations
          </button>
        </form>
      </div>
    </div>
  );
}
