from datetime import datetime

from pydantic import BaseModel, Field


class InventoryItem(BaseModel):
    sku: str = Field(description="Unique stock keeping unit identifier.")
    name: str = Field(description="Name of the item.")
    current_stock: int = Field(description="Current level of stock in inventory.")
    minimum_stock: int = Field(
        description="Minimum threshold before reordering is required."
    )
    units: str = Field(description="Unit of measurement (e.g., units, kg, boxes).")
    supplier: str | None = Field(default=None, description="Preferred supplier.")
    unit_price: float | None = Field(default=None, description="Unit price.")
    average_daily_sales: float | None = Field(
        default=None, description="Average daily sales rate."
    )


class InventoryReport(BaseModel):
    timestamp: str = Field(
        default_factory=lambda: datetime.utcnow().isoformat(), description="Time of stock inspection."
    )
    items_checked: list[InventoryItem] = Field(
        default_factory=list, description="All items checked during run."
    )
    low_stock_items: list[InventoryItem] = Field(
        default_factory=list, description="Items identified as below minimum stock."
    )


class DemandForecast(BaseModel):
    sku: str = Field(description="Unique stock keeping unit identifier.")
    expected_demand: int = Field(
        description="Predicted demand for the item over the next cycle."
    )
    confidence_score: float = Field(
        description="Model confidence rating between 0.0 and 1.0."
    )


class ForecastReport(BaseModel):
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    forecasts: list[DemandForecast] = Field(default_factory=list)


class SupplierRecommendation(BaseModel):
    sku: str = Field(description="Unique stock keeping unit identifier.")
    supplier_name: str = Field(description="Name of recommended supplier.")
    unit_price: float = Field(description="Quote unit price from supplier.")
    lead_time_days: int = Field(description="Estimated shipping days to delivery.")
    rating: float = Field(
        description="Supplier reliability rating between 1.0 and 5.0."
    )


class SupplierReport(BaseModel):
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    recommendations: list[SupplierRecommendation] = Field(default_factory=list)


class PurchaseRecommendation(BaseModel):
    sku: str = Field(description="Unique stock keeping unit identifier.")
    quantity_to_order: int = Field(description="Calculated optimal quantity to order.")
    recommended_supplier: str = Field(description="Selected supplier name.")
    unit_price: float = Field(description="Unit cost from the supplier.")
    total_cost: float = Field(
        description="Total cost (unit_price * quantity_to_order)."
    )


class PurchaseRecommendationsReport(BaseModel):
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    recommendations: list[PurchaseRecommendation] = Field(default_factory=list)


class HumanApprovalResponse(BaseModel):
    approved: bool = Field(
        description="Whether the purchase recommendation was approved by the manager."
    )
    notes: str | None = Field(
        default=None, description="Review notes or rejection reasons."
    )


class PurchaseOrderItem(BaseModel):
    sku: str
    quantity: int
    unit_price: float
    total_price: float


class PurchaseOrder(BaseModel):
    po_number: str = Field(description="Generated unique Purchase Order identifier.")
    supplier_name: str
    items: list[PurchaseOrderItem]
    total_amount: float
    status: str = Field(
        default="GENERATED",
        description="Status of the PO (e.g. GENERATED, SENT, DELIVERED).",
    )
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class SupplierEmailDraft(BaseModel):
    to_email: str
    subject: str
    body: str
    sent: bool = Field(default=False)


class DeliveryEstimation(BaseModel):
    po_number: str
    estimated_delivery_date: str
    status: str = Field(default="PENDING")


class SecurityEvent(BaseModel):
    violation_type: str = Field(
        description="Type of security violation (e.g. PROMPT_INJECTION, DATA_VALIDATION_ERROR)."
    )
    details: str = Field(description="Specific details of the flagged violation.")
    timestamp: str = Field(
        default_factory=lambda: datetime.utcnow().isoformat(), description="Time of security flag."
    )


class WorkflowState(BaseModel):
    """Workflow state schema for Inventra AI."""

    inventory_report: InventoryReport | None = None
    forecast_report: ForecastReport | None = None
    supplier_report: SupplierReport | None = None
    purchase_recommendations: PurchaseRecommendationsReport | None = None
    # Warning text set by modify_recommendations when the manager chooses a
    # quantity that leaves stock below the minimum threshold.  Read by
    # human_approval to inform the manager before they decide.  Cleared to
    # None once the manager makes a decision.
    below_threshold_warning: str | None = None
    approval_response: HumanApprovalResponse | None = None
    purchase_orders: list[PurchaseOrder] = Field(default_factory=list)
    emails: list[SupplierEmailDraft] = Field(default_factory=list)
    delivery_estimations: list[DeliveryEstimation] = Field(default_factory=list)
    inventory_updated: bool = Field(default=False)
    security_event: SecurityEvent | None = None
    approval_iteration: int = Field(default=0)
    execution_id: str = Field(default="")
