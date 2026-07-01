// Mock data for the Inventra AI Inventory and Procurement Dashboard

export const kpiMetrics = [
  {
    id: "total-products",
    label: "Total Products",
    value: "42,890",
    change: "+1,240 this week",
    type: "positive",
    icon: "box"
  },
  {
    id: "low-stock-alerts",
    label: "Low Stock Alerts",
    value: "1,248",
    change: "+142 since yesterday",
    type: "negative",
    icon: "alert"
  },
  {
    id: "pending-pos",
    label: "Pending Purchase Orders",
    value: "142",
    change: "24 awaiting approval",
    type: "neutral",
    icon: "file-text"
  },
  {
    id: "inventory-health",
    label: "Inventory Health",
    value: "94.8%",
    change: "+0.8% vs last month",
    type: "positive",
    icon: "activity"
  }
];

export const featuredProducts = [
  {
    id: "fp-1",
    name: "Coca-Cola 500ml",
    stock: 30,
    status: "Low Stock",
    category: "Beverages",
    sku: "COK-CLS-500",
    image: "/assets/organic_honey.png" // We keep local image but match text
  },
  {
    id: "fp-2",
    name: "Lays Classic 150g",
    stock: 18,
    status: "Critical",
    category: "Snacks",
    sku: "LAY-CLS-150",
    image: "/assets/fresh_strawberries.png"
  },
  {
    id: "fp-3",
    name: "Amul Milk 1L",
    stock: 42,
    status: "Low Stock",
    category: "Dairy",
    sku: "MILK-AML-1L",
    image: "/assets/whole_milk.png"
  },
  {
    id: "fp-4",
    name: "Basmati Rice 5kg",
    stock: 120,
    status: "Healthy",
    category: "Staples",
    sku: "RICE-XXX-5KG",
    image: "/assets/ground_coffee.png"
  },
  {
    id: "fp-5",
    name: "Maggi 2-Min 70g",
    stock: 35,
    status: "Low Stock",
    category: "Instant Food",
    sku: "MAG-2MIN-70G",
    image: "/assets/fresh_avocados.png"
  },
  {
    id: "fp-6",
    name: "White Eggs (30)",
    stock: 80,
    status: "Healthy",
    category: "Poultry",
    sku: "EGG-WHT-30",
    image: "/assets/whole_wheat_bread.png"
  }
];

export const recentAlerts = [
  {
    id: "alert-1",
    message: "Coca-Cola stock below threshold",
    details: "15 units remaining",
    severity: "Critical", // Critical, Warning, Info
    timestamp: "2 min ago",
    sku: "COK-CLS-500"
  },
  {
    id: "alert-2",
    message: "Whole Milk (1L) expiry approaching",
    details: "Expires on: Oct 29, 2026",
    severity: "Warning",
    timestamp: "1 hour ago",
    sku: "MILK-AML-1L"
  },
  {
    id: "alert-3",
    message: "Basmati Rice demand increased",
    details: "+28% vs last week",
    severity: "Info",
    timestamp: "3 hours ago",
    sku: "RICE-XXX-5KG"
  },
  {
    id: "alert-4",
    message: "Lays Classic low stock",
    details: "18 units remaining",
    severity: "Warning", // matches amber color in screenshot
    timestamp: "5 hours ago",
    sku: "LAY-CLS-150"
  }
];

export const allInventory = [
  { name: "Coca-Cola 500ml", sku: "COK-CLS-500", category: "Beverages", currentStock: 30, reorderThreshold: 50, supplier: "ABC Distributors", status: "Low Stock" },
  { name: "Amul Milk 1L", sku: "MILK-AML-1L", category: "Dairy", currentStock: 42, reorderThreshold: 60, supplier: "Dairy Fresh", status: "Low Stock" },
  { name: "Lays Classic 150g", sku: "LAY-CLS-150", category: "Snacks", currentStock: 18, reorderThreshold: 40, supplier: "ABC Distributors", status: "Critical" },
  { name: "Basmati Rice 5kg", sku: "RICE-XXX-5KG", category: "Staples", currentStock: 120, reorderThreshold: 80, supplier: "Grain Suppliers", status: "Healthy" },
  { name: "Maggi 2-Min 70g", sku: "MAG-2MIN-70G", category: "Instant Food", currentStock: 35, reorderThreshold: 50, supplier: "ABC Distributors", status: "Low Stock" },
  { name: "White Eggs (30)", sku: "EGG-WHT-30", category: "Poultry", currentStock: 80, reorderThreshold: 60, supplier: "Fresh Farms", status: "Healthy" },
  { name: "Organic Honey 500g", sku: "HON-ORG-500", category: "Pantry", currentStock: 120, reorderThreshold: 30, supplier: "BeeSweet Farms", status: "Healthy" },
  { name: "Fresh Strawberries", sku: "STR-FRE-250", category: "Produce", currentStock: 8, reorderThreshold: 20, supplier: "GreenFields Co.", status: "Critical" },
  { name: "Ground Coffee 500g", sku: "COF-GRN-500", category: "Beverages", currentStock: 12, reorderThreshold: 15, supplier: "Java Roast Co.", status: "Low Stock" },
  { name: "Fresh Avocados 1kg", sku: "AVO-FRE-PKG", category: "Produce", currentStock: 85, reorderThreshold: 25, supplier: "EcoProduce Dist.", status: "Healthy" },
  { name: "Whole Wheat Bread", sku: "BRD-WHT-800", category: "Bakery", currentStock: 5, reorderThreshold: 15, supplier: "Daily Bakehouse", status: "Critical" },
  { name: "Greek Yogurt 500g", sku: "YOG-GRK-500", category: "Dairy", currentStock: 18, reorderThreshold: 25, supplier: "Cloverdale Dairies", status: "Low Stock" },
  { name: "Extra Virgin Olive Oil", sku: "OIL-EVO-750", category: "Pantry", currentStock: 64, reorderThreshold: 20, supplier: "Mediterranean Foods", status: "Healthy" },
  { name: "Organic Bananas 1kg", sku: "BAN-ORG-1KG", category: "Produce", currentStock: 9, reorderThreshold: 15, supplier: "GreenFields Co.", status: "Low Stock" },
  { name: "Cheddar Cheese 250g", sku: "CHS-CHD-250", category: "Dairy", currentStock: 32, reorderThreshold: 10, supplier: "Cloverdale Dairies", status: "Healthy" },
  { name: "Almond Milk Unsweetened", sku: "MLK-ALM-1L", category: "Dairy Alternative", currentStock: 28, reorderThreshold: 15, supplier: "NutriDrink Co.", status: "Healthy" },
  { name: "Spaghetti Pasta 500g", sku: "PST-SPG-500", category: "Pantry", currentStock: 210, reorderThreshold: 40, supplier: "Mediterranean Foods", status: "Healthy" },
  { name: "Marinara Pasta Sauce", sku: "SCE-MAR-400", category: "Pantry", currentStock: 14, reorderThreshold: 20, supplier: "Mediterranean Foods", status: "Low Stock" },
  { name: "Free Range Eggs Dozen", sku: "EGG-FRG-DZ", category: "Dairy", currentStock: 74, reorderThreshold: 20, supplier: "GreenFields Co.", status: "Healthy" },
  { name: "Fresh Atlantic Salmon", sku: "FSH-SLM-PKG", category: "Seafood", currentStock: 4, reorderThreshold: 10, supplier: "Ocean Catch Ltd.", status: "Critical" },
  { name: "Organic Chicken Breast", sku: "MEAT-CHK-KG", category: "Meat", currentStock: 22, reorderThreshold: 15, supplier: "GreenFields Co.", status: "Healthy" },
  { name: "Salted Butter 250g", sku: "BTR-SLT-250", category: "Dairy", currentStock: 50, reorderThreshold: 20, supplier: "Cloverdale Dairies", status: "Healthy" },
  { name: "Crunchy Peanut Butter", sku: "PNT-BUT-400", category: "Pantry", currentStock: 36, reorderThreshold: 15, supplier: "BeeSweet Farms", status: "Healthy" }
];
