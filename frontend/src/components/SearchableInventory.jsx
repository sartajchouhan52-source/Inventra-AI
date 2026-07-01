import React, { useState } from "react";
import toast from "react-hot-toast";
import { allInventory as initialInventory } from "../mock/inventoryData";

export default function SearchableInventory() {
  const [inventoryList, setInventoryList] = useState(initialInventory);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [supplierFilter, setSupplierFilter] = useState("All");
  const [page, setPage] = useState(1);

  // CRUD Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Delete Confirmation Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form States
  const [formName, setFormName] = useState("");
  const [formSku, setFormSku] = useState("");
  const [formCategory, setFormCategory] = useState("Beverages");
  const [formStock, setFormStock] = useState(100);
  const [formThreshold, setFormThreshold] = useState(50);
  const [formSupplier, setFormSupplier] = useState("ABC Distributors");

  const categories = ["All", "Beverages", "Dairy", "Snacks", "Staples", "Produce", "Pantry", "Bakery", "Instant Food", "Poultry"];
  const suppliers = ["All", "ABC Distributors", "Dairy Fresh", "Grain Suppliers", "Fresh Farms", "BeeSweet Farms", "GreenFields Co.", "Java Roast Co."];

  // Helper to determine status based on stock and threshold
  const calculateStatus = (stock, threshold) => {
    if (stock <= 0) return "Critical";
    if (stock < threshold) return "Low Stock";
    return "Healthy";
  };

  // CRUD - CREATE
  const handleAddProductSubmit = (e) => {
    e.preventDefault();
    if (!formName.trim() || !formSku.trim()) {
      toast.error("Name and SKU are required fields.");
      return;
    }

    // Security sanitization check: check for common scripts/jailbreaks
    const securityPattern = /ignore|script|select|insert|union/i;
    if (securityPattern.test(formName) || securityPattern.test(formSku)) {
      toast.error("Security Alert: Malicious input characters detected. Registration blocked.");
      return;
    }

    // Duplicate SKU check
    if (inventoryList.some(item => item.sku.toLowerCase() === formSku.trim().toLowerCase())) {
      toast.error("A product with this SKU already exists in the catalog.");
      return;
    }

    const newProduct = {
      name: formName.trim(),
      sku: formSku.trim().toUpperCase(),
      category: formCategory,
      currentStock: formStock,
      reorderThreshold: formThreshold,
      supplier: formSupplier,
      status: calculateStatus(formStock, formThreshold)
    };

    setInventoryList((prev) => [newProduct, ...prev]);
    setShowAddModal(false);
    resetForm();
    toast.success(`${newProduct.name} (${newProduct.sku}) registered in catalog successfully.`);
  };

  // CRUD - UPDATE
  const handleOpenEdit = (item) => {
    setSelectedProduct(item);
    setFormName(item.name);
    setFormSku(item.sku);
    setFormCategory(item.category);
    setFormStock(item.currentStock);
    setFormThreshold(item.reorderThreshold);
    setFormSupplier(item.supplier);
    setShowEditModal(true);
  };

  const handleEditProductSubmit = (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Product name is required.");
      return;
    }

    // Security check
    const securityPattern = /ignore|script|select|insert|union/i;
    if (securityPattern.test(formName)) {
      toast.error("Security Alert: Malicious patterns detected. Modification aborted.");
      return;
    }

    const updatedSku = selectedProduct.sku;
    setInventoryList((prev) =>
      prev.map((item) => {
        if (item.sku === selectedProduct.sku) {
          return {
            ...item,
            name: formName.trim(),
            category: formCategory,
            currentStock: formStock,
            reorderThreshold: formThreshold,
            supplier: formSupplier,
            status: calculateStatus(formStock, formThreshold)
          };
        }
        return item;
      })
    );

    setShowEditModal(false);
    setSelectedProduct(null);
    resetForm();
    toast.success(`Product ${updatedSku} specifications updated successfully.`);
  };

  // CRUD - DELETE
  const handleDeleteProduct = (item) => {
    setDeleteTarget(item);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    const sku = deleteTarget.sku;
    const name = deleteTarget.name;
    setInventoryList((prev) => prev.filter(item => item.sku !== sku));
    setShowDeleteModal(false);
    setDeleteTarget(null);
    toast(`${name} (${sku}) removed from catalog.`, {
      icon: '🗑️',
      duration: 4000,
      style: {
        borderLeft: '4px solid var(--danger)',
        background: '#fff',
        color: 'var(--text-primary)',
      },
    });
  };

  const resetForm = () => {
    setFormName("");
    setFormSku("");
    setFormCategory("Beverages");
    setFormStock(100);
    setFormThreshold(50);
    setFormSupplier("ABC Distributors");
  };

  // Filter products
  const filteredInventory = inventoryList.filter((item) => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === "All" || item.category === categoryFilter;
    const matchesSupplier = supplierFilter === "All" || item.supplier === supplierFilter;

    return matchesSearch && matchesCategory && matchesSupplier;
  });

  const itemsPerPage = 10;
  const totalItems = 42890 + (inventoryList.length - initialInventory.length); // Scaled up catalog count
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const startIndex = (page - 1) * itemsPerPage;
  const paginatedItems = filteredInventory.length > 0 
    ? filteredInventory.slice(startIndex % filteredInventory.length, (startIndex % filteredInventory.length) + itemsPerPage)
    : [];

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  return (
    <div className="inventory-section-card">
      <div className="section-header" style={{ marginBottom: "20px" }}>
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
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
          Operational Inventory Catalog
        </h2>
        <button 
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="status-badge healthy" 
          style={{ cursor: "pointer", border: "1px solid var(--success)", backgroundColor: "white", padding: "6px 14px", fontSize: "0.8rem", fontWeight: 700 }}
        >
          + Add Product SKU
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
        <div className="search-bar-container">
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
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search by catalog SKU or product name..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          />
        </div>

        {/* Dropdown filters */}
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: "200px" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)" }}>Category:</span>
            <select 
              value={categoryFilter} 
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="rec-qty-input"
              style={{ width: "100%", height: "36px", fontSize: "0.8rem" }}
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: "200px" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)" }}>Supplier:</span>
            <select 
              value={supplierFilter} 
              onChange={(e) => { setSupplierFilter(e.target.value); setPage(1); }}
              className="rec-qty-input"
              style={{ width: "100%", height: "36px", fontSize: "0.8rem" }}
            >
              {suppliers.map(sup => <option key={sup} value={sup}>{sup}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Database Table */}
      <div className="table-wrapper">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Product Specification</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Current Stock</th>
              <th>Safety Threshold</th>
              <th>Supplier Partner</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.length > 0 ? (
              paginatedItems.map((item) => (
                <tr key={item.sku}>
                  <td>
                    <span className="table-product-name" style={{ fontWeight: 700 }}>{item.name}</span>
                  </td>
                  <td>
                    <span className="table-product-sku" style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>{item.sku}</span>
                  </td>
                  <td>{item.category}</td>
                  <td style={{ fontWeight: 600 }}>{item.currentStock.toLocaleString()} units</td>
                  <td style={{ color: "var(--text-secondary)" }}>{item.reorderThreshold} units</td>
                  <td>{item.supplier}</td>
                  <td>
                    <span className={`status-badge ${item.status.replace(/\s+/g, "").toLowerCase()}`}>
                      {item.status}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                      <button 
                        className="btn-rec-action modify" 
                        onClick={() => handleOpenEdit(item)}
                        style={{ padding: "4px 10px", fontSize: "0.75rem", borderRadius: "6px" }}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn-rec-action" 
                        onClick={() => handleDeleteProduct(item)}
                        style={{ padding: "4px 10px", fontSize: "0.75rem", borderRadius: "6px", border: "1px solid var(--danger)", color: "var(--danger)" }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "32px 0", color: "var(--text-secondary)" }}>
                  No stock items match the active catalog filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0 0", borderTop: "1px solid var(--border)", marginTop: "16px", flexWrap: "wrap", gap: "12px" }}>
        <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 550 }}>
          Showing {startIndex + 1}–{startIndex + paginatedItems.length} of {totalItems.toLocaleString()} products
        </span>
        
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button 
            className="btn-qty-adj" 
            onClick={handlePrevPage} 
            disabled={page === 1}
            style={{ opacity: page === 1 ? 0.5 : 1, cursor: page === 1 ? "not-allowed" : "pointer" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          
          <span style={{ fontSize: "0.8rem", fontWeight: 700, minWidth: "100px", textAlign: "center" }}>
            Page {page} of {totalPages.toLocaleString()}
          </span>

          <button 
            className="btn-qty-adj" 
            onClick={handleNextPage} 
            disabled={page === totalPages}
            style={{ opacity: page === totalPages ? 0.5 : 1, cursor: page === totalPages ? "not-allowed" : "pointer" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content animate-scale-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px" }}>
            <div className="modal-icon-container" style={{ backgroundColor: "var(--success-bg)", color: "var(--success)" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </div>
            <h3 className="modal-title" style={{ textAlign: "center", marginBottom: "20px" }}>Add Product SKU</h3>
            <form onSubmit={handleAddProductSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Product Name</label>
                <input 
                  type="text" 
                  value={formName} 
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Whole Wheat Bread" 
                  className="rec-qty-input"
                  style={{ width: "100%", height: "40px" }}
                />
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Catalog SKU</label>
                  <input 
                    type="text" 
                    value={formSku} 
                    onChange={(e) => setFormSku(e.target.value)}
                    placeholder="e.g. BRD-WHT-800" 
                    className="rec-qty-input"
                    style={{ width: "100%", height: "40px" }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Category</label>
                  <select 
                    value={formCategory} 
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="rec-qty-input"
                    style={{ width: "100%", height: "40px" }}
                  >
                    {categories.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Initial Stock</label>
                  <input 
                    type="number" 
                    value={formStock} 
                    onChange={(e) => setFormStock(parseInt(e.target.value) || 0)}
                    className="rec-qty-input"
                    style={{ width: "100%", height: "40px" }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Safety Reorder Point</label>
                  <input 
                    type="number" 
                    value={formThreshold} 
                    onChange={(e) => setFormThreshold(parseInt(e.target.value) || 0)}
                    className="rec-qty-input"
                    style={{ width: "100%", height: "40px" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Primary Supplier Partner</label>
                <select 
                  value={formSupplier} 
                  onChange={(e) => setFormSupplier(e.target.value)}
                  className="rec-qty-input"
                  style={{ width: "100%", height: "40px" }}
                >
                  {suppliers.slice(1).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "12px" }}>
                <button type="button" className="btn-rec-global cancel" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-rec-global save">
                  Register Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product / Update Stock Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content animate-scale-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px" }}>
            <div className="modal-icon-container" style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </div>
            <h3 className="modal-title" style={{ textAlign: "center", marginBottom: "20px" }}>Edit Product Specifications</h3>
            <form onSubmit={handleEditProductSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Product Name</label>
                <input 
                  type="text" 
                  value={formName} 
                  onChange={(e) => setFormName(e.target.value)}
                  className="rec-qty-input"
                  style={{ width: "100%", height: "40px" }}
                />
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>SKU Code (Read-only)</label>
                  <input 
                    type="text" 
                    value={formSku} 
                    disabled 
                    className="rec-qty-input"
                    style={{ width: "100%", height: "40px", backgroundColor: "#f1f5f9", cursor: "not-allowed" }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Category</label>
                  <select 
                    value={formCategory} 
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="rec-qty-input"
                    style={{ width: "100%", height: "40px" }}
                  >
                    {categories.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Current Catalog Stock</label>
                  <input 
                    type="number" 
                    value={formStock} 
                    onChange={(e) => setFormStock(parseInt(e.target.value) || 0)}
                    className="rec-qty-input"
                    style={{ width: "100%", height: "40px" }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Safety Reorder Buffer</label>
                  <input 
                    type="number" 
                    value={formThreshold} 
                    onChange={(e) => setFormThreshold(parseInt(e.target.value) || 0)}
                    className="rec-qty-input"
                    style={{ width: "100%", height: "40px" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Supplier Partner</label>
                <select 
                  value={formSupplier} 
                  onChange={(e) => setFormSupplier(e.target.value)}
                  className="rec-qty-input"
                  style={{ width: "100%", height: "40px" }}
                >
                  {suppliers.slice(1).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "12px" }}>
                <button type="button" className="btn-rec-global cancel" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-rec-global save">
                  Save Specifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteTarget && (
        <div className="modal-overlay" style={{ zIndex: 3000 }}>
          <div className="modal-content animate-scale-in" style={{ maxWidth: "440px" }}>
            <div className="modal-icon-container" style={{ backgroundColor: "var(--danger-bg)", color: "var(--danger)" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </div>
            <h3 className="modal-title" style={{ color: "var(--danger-text)" }}>Delete Product?</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: "12px 0 4px", textAlign: "center" }}>
              This will permanently remove <strong>{deleteTarget.name}</strong> from the inventory catalog.
            </p>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "0 0 6px", textAlign: "center", fontFamily: "monospace" }}>
              SKU: {deleteTarget.sku} · {deleteTarget.currentStock} units in stock
            </p>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "0 0 20px", textAlign: "center" }}>
              This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button 
                className="btn-rec-global cancel" 
                onClick={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
                style={{ padding: "10px 24px" }}
              >
                Keep Product
              </button>
              <button 
                className="btn-rec-global reject-all" 
                onClick={handleConfirmDelete}
                style={{ padding: "10px 24px" }}
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
