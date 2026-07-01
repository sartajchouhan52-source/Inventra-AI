// utils/procurementValidator.js
// Validation helper for custom purchase orders
// This module provides a function to validate draft order items against business rules.
// It returns an object with flags and messages to be displayed to the user.

export const validatePurchaseOrder = (draftItems, existingOrders, storageCapacity, supplierList) => {
  const errors = [];
  const warnings = [];

  // Compute totals
  let totalQty = 0;
  let totalCost = 0;
  const suppliers = new Set();

  draftItems.forEach((item) => {
    const qty = Number(item.quantity);
    if (isNaN(qty) || qty <= 0) {
      errors.push(`Quantity for ${item.product} must be greater than zero.`);
    }
    totalQty += qty;
    const price = Number(item.unitPrice) || 1.5; // fallback price
    totalCost += qty * price;
    suppliers.add(item.supplier);
  });

  // Large quantity warning: >5x average order quantity
  const avgQty = existingOrders.reduce((sum, o) => sum + o.quantity, 0) / (existingOrders.length || 1);
  if (totalQty > avgQty * 5) {
    warnings.push(`Total quantity (${totalQty}) appears unusually high compared to typical orders.`);
  }

  // Storage capacity check
  if (typeof storageCapacity === 'number' && totalQty > storageCapacity) {
    warnings.push(`Requested quantity (${totalQty}) exceeds storage capacity (${storageCapacity}).`);
  }

  // Supplier validation
  const validSuppliers = new Set(supplierList);
  suppliers.forEach((s) => {
    if (!validSuppliers.has(s)) {
      errors.push(`Supplier "${s}" is not recognized.`);
    }
  });

  // Duplicate pending orders detection
  draftItems.forEach((item) => {
    const duplicate = existingOrders.find(
      (o) => o.product === item.product && o.supplier === item.supplier && (o.status === 'Pending Approval' || o.status === 'Approved')
    );
    if (duplicate) {
      warnings.push(`A pending order for ${item.product} from ${item.supplier} already exists (PO ${duplicate.poNumber}).`);
    }
  });

  return { ok: errors.length === 0, errors, warnings, totalQty, totalCost, suppliers: Array.from(suppliers) };
};
