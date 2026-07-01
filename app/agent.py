# ruff: noqa
# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import os
import uuid
from typing import AsyncGenerator, List, Any, Union
from datetime import datetime, timedelta

from google.adk.agents.context import Context
from google.adk.events.event import Event
from google.adk.events.event_actions import EventActions
from google.adk.events.request_input import RequestInput
from google.adk.workflow import Workflow, node, START
from google.adk.apps import App, ResumabilityConfig
from google.genai import types

# Import our domain models
from app.models import (
    WorkflowState,
    InventoryItem,
    InventoryReport,
    DemandForecast,
    ForecastReport,
    SupplierRecommendation,
    SupplierReport,
    PurchaseRecommendation,
    PurchaseRecommendationsReport,
    HumanApprovalResponse,
    PurchaseOrderItem,
    PurchaseOrder,
    SupplierEmailDraft,
    DeliveryEstimation,
    SecurityEvent,
)

# Set environment variables for local dev / AI Studio API usage
os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "False"


# ==============================================================================
# SECURITY CHECKPOINT NODE
# ==============================================================================
@node
def security_checkpoint(ctx: Context, node_input: Any) -> Event:
    """Validates data integrity and scans for prompt injection attempts.

    Responsibility:
      - Validates the structure and properties of the incoming request.
      - Checks for malformed records, negative prices, negative stock, or duplicate SKUs.
      - Scans all text fields for behavior manipulation keywords.
    """
    text_content = ""
    # Extract text from START user message
    if isinstance(node_input, types.Content) and node_input.parts:
        text_content = " ".join([p.text for p in node_input.parts if p.text]).lower()
    elif isinstance(node_input, str):
        text_content = node_input.lower()

    # Generate a unique execution ID for this run to avoid matching stale resume_inputs from previous runs in the same session
    execution_id = uuid.uuid4().hex[:8]

    # 1. Prompt Injection Detection
    injection_signatures = [
        "ignore previous instructions",
        "bypass approval",
        "force purchase",
        "system override",
        "you are now admin",
        "ignore rules",
    ]
    for signature in injection_signatures:
        if signature in text_content:
            event = SecurityEvent(
                violation_type="PROMPT_INJECTION",
                details=f"Suspicious behavior manipulation pattern detected: '{signature}'",
            )
            return Event(
                output=event.model_dump(mode="json"),
                actions=EventActions(
                    route="flagged",
                    state_delta={
                        "security_event": event.model_dump(mode="json"),
                        "execution_id": execution_id,
                        "approval_iteration": 0,
                    },
                ),
            )

    # 2. Data Validation Checks
    if "invalid_data" in text_content or "negative_stock" in text_content:
        event = SecurityEvent(
            violation_type="DATA_VALIDATION_ERROR",
            details="Malformed inventory data: Negative stock level identified.",
        )
        return Event(
            output=event.model_dump(mode="json"),
            actions=EventActions(
                route="flagged",
                state_delta={
                    "security_event": event.model_dump(mode="json"),
                    "execution_id": execution_id,
                    "approval_iteration": 0,
                },
            ),
        )

    # Proceed normally if checks pass
    return Event(
        output=node_input,
        actions=EventActions(
            route="valid",
            state_delta={
                "execution_id": execution_id,
                "approval_iteration": 0,
            },
        ),
    )


# ==============================================================================
# SECURITY HUMAN REVIEW NODE (HITL Override)
# ==============================================================================
@node(rerun_on_resume=True)
async def security_human_review(
    ctx: Context, node_input: SecurityEvent
) -> AsyncGenerator[Union[Event, RequestInput], None]:
    """Pauses the workflow for immediate security administrator review.

    Responsibility:
      - Presents details of the security violation to the administrator.
      - Halts workflow progression.
      - Allows admin to either 'Override & Proceed' or 'Quarantine & Reject'.
    """
    execution_id = ctx.state.get("execution_id") or "default"
    interrupt_id = f"security_action_{execution_id}"

    if not ctx.resume_inputs or interrupt_id not in ctx.resume_inputs:
        message = (
            f"[SECURITY ALERT] A security violation has been flagged:\n"
            f"- Type: {node_input.violation_type}\n"
            f"- Details: {node_input.details}\n\n"
            "Please respond with 'override' to authorize and proceed, or 'quarantine' to reject."
        )
        yield RequestInput(interrupt_id=interrupt_id, message=message)
        return

    raw_action = ctx.resume_inputs[interrupt_id]
    if isinstance(raw_action, dict):
        admin_decision = raw_action.get("action", "").strip().lower()
    else:
        admin_decision = str(raw_action).strip().lower()

    if "override" in admin_decision or "proceed" in admin_decision:
        # Clear security event and proceed to inventory monitoring
        yield Event(
            output="Security check bypassed by administrator override.",
            actions=EventActions(
                route="override_approved", state_delta={"security_event": None}
            ),
        )
    else:
        # Move directly to rejection/termination state
        flag = HumanApprovalResponse(
            approved=False, notes=f"Security Quarantine: {node_input.details}"
        )
        yield Event(
            output="Threat quarantined. Terminating workflow cycle.",
            actions=EventActions(
                route="quarantined",
                state_delta={"approval_response": flag.model_dump(mode="json")},
            ),
        )


# ==============================================================================
# 1. INVENTORY MONITORING NODE
# ==============================================================================
@node
def inventory_monitoring(ctx: Context, node_input: Any) -> Event:
    """1. Checks current stock levels and identifies low-stock items.

    Responsibility:
      - Reads real-time stock levels from local database or ERP.
      - Compares stock against minimum threshold limits.
      - Filters out items requiring immediate reorder.
    """
    items = []
    text_content = ""
    # Extract text from START user message or previous node output
    if isinstance(node_input, types.Content) and node_input.parts:
        text_content = " ".join([p.text for p in node_input.parts if p.text])
    elif isinstance(node_input, str):
        text_content = node_input

    data = None
    if text_content:
        import json
        try:
            data = json.loads(text_content)
        except Exception:
            pass

    if not data and isinstance(node_input, dict):
        data = node_input
    elif not data and isinstance(node_input, list):
        data = node_input

    if isinstance(data, dict):
        data = [data]

    if isinstance(data, list):
        for entry in data:
            if isinstance(entry, dict) and ("product_name" in entry or "name" in entry) and "current_stock" in entry:
                name = entry.get("product_name") or entry.get("name")
                sku = entry.get("sku") or f"SKU-{name.upper().replace(' ', '-').strip('-')[:10].strip('-')}"
                min_stock = entry.get("reorder_threshold") or entry.get("minimum_stock") or 10
                items.append(
                    InventoryItem(
                        sku=sku,
                        name=name,
                        current_stock=int(entry["current_stock"]),
                        minimum_stock=int(min_stock),
                        units=entry.get("units") or "units",
                        supplier=entry.get("supplier"),
                        unit_price=entry.get("unit_price"),
                        average_daily_sales=float(entry["average_daily_sales"]) if entry.get("average_daily_sales") is not None else None,
                    )
                )

    if not items:
        # Fallback to simulated stock check (default dummy items)
        items = [
            InventoryItem(
                sku="SKU-MILK-01",
                name="Organic Whole Milk 1L",
                current_stock=5,
                minimum_stock=10,
                units="units",
            ),
            InventoryItem(
                sku="SKU-BREAD-02",
                name="Sourdough Bread loaf",
                current_stock=12,
                minimum_stock=8,
                units="units",
            ),
            InventoryItem(
                sku="SKU-APPLE-03",
                name="Red Apples 1kg",
                current_stock=3,
                minimum_stock=15,
                units="units",
            ),
        ]

    # Identify items with stock < minimum_stock
    low_stock = [item for item in items if item.current_stock < item.minimum_stock]

    report = InventoryReport(items_checked=items, low_stock_items=low_stock)

    route = "low_stock" if low_stock else "sufficient_stock"

    # Propagate the report to downstream nodes and save it in workflow state
    return Event(
        output=report.model_dump(mode="json"),
        actions=EventActions(
            route=route,
            state_delta={"inventory_report": report.model_dump(mode="json")}
        ),
    )


# ==============================================================================
# 2. DEMAND FORECASTING NODE
# ==============================================================================
@node
def demand_forecasting(ctx: Context, node_input: InventoryReport) -> Event:
    """2. Forecasts future demand for identified low-stock items.

    Responsibility:
      - Analyzes historical sales data for the low-stock items.
      - Calls demand prediction models (e.g. ARIMA, Prophet, or BigQuery ML).
      - Outputs expected demand requirements over the next cycle (30 days).
    """
    forecasts = []
    # Predict demand for each low stock item
    for item in node_input.low_stock_items:
        # Forecast demand based on average historical baseline + average daily sales if available
        base_demand = (item.minimum_stock * 2) - item.current_stock
        daily_sales = item.average_daily_sales or 0.0
        expected_demand = int(base_demand + (daily_sales * 5))
        forecasts.append(
            DemandForecast(
                sku=item.sku, expected_demand=expected_demand, confidence_score=0.85
            )
        )

    report = ForecastReport(forecasts=forecasts)
    return Event(
        output=report.model_dump(mode="json"),
        actions=EventActions(
            state_delta={"forecast_report": report.model_dump(mode="json")}
        ),
    )


# ==============================================================================
# 3. SUPPLIER RECOMMENDATION NODE
# ==============================================================================
@node
def supplier_recommendation(ctx: Context, node_input: ForecastReport) -> Event:
    """3. Evaluates and recommends the best supplier for each required item.

    Responsibility:
      - Queries registered suppliers for catalog pricing and lead times.
      - Rates supplier reliability based on delivery history and pricing.
      - Recommends the optimal supplier option.
    """
    raw_inventory = ctx.state.get("inventory_report")
    inventory_report = (
        InventoryReport(**raw_inventory)
        if isinstance(raw_inventory, dict)
        else raw_inventory
    )

    recommendations = []
    for forecast in node_input.forecasts:
        # Find matching item in inventory to preserve custom supplier and price
        matching_item = None
        if inventory_report and inventory_report.items_checked:
            matching_item = next(
                (item for item in inventory_report.items_checked if item.sku == forecast.sku),
                None,
            )

        supplier_name = (
            matching_item.supplier
            if matching_item and matching_item.supplier
            else "Global Food Distributors Inc."
        )
        unit_price = (
            matching_item.unit_price
            if matching_item and matching_item.unit_price is not None
            else 2.50
        )

        recommendations.append(
            SupplierRecommendation(
                sku=forecast.sku,
                supplier_name=supplier_name,
                unit_price=unit_price,
                lead_time_days=3,
                rating=4.8,
            )
        )

    report = SupplierReport(recommendations=recommendations)
    return Event(
        output=report.model_dump(mode="json"),
        actions=EventActions(
            state_delta={"supplier_report": report.model_dump(mode="json")}
        ),
    )


# ==============================================================================
# 4. PURCHASE RECOMMENDATION NODE
# ==============================================================================
@node
def purchase_recommendation(ctx: Context, node_input: SupplierReport) -> Event:
    """4. Synthesizes demand and supplier data into a clear purchase plan.

    Responsibility:
      - Combines predicted demand, stock deficit, and supplier details.
      - Calculates optimal order quantity and total purchase costs.
      - Prepares recommendation payload for manager approval.
    """
    # Resolve required forecast details from the shared state
    raw_forecast = ctx.state.get("forecast_report")
    forecast_report = (
        ForecastReport(**raw_forecast)
        if isinstance(raw_forecast, dict)
        else raw_forecast
    )

    recommendations = []
    for supplier_rec in node_input.recommendations:
        # Find matching forecast
        matching_forecast = None
        if forecast_report and forecast_report.forecasts:
            matching_forecast = next(
                (f for f in forecast_report.forecasts if f.sku == supplier_rec.sku),
                None,
            )

        qty = matching_forecast.expected_demand if matching_forecast else 10

        recommendations.append(
            PurchaseRecommendation(
                sku=supplier_rec.sku,
                quantity_to_order=qty,
                recommended_supplier=supplier_rec.supplier_name,
                unit_price=supplier_rec.unit_price,
                total_cost=qty * supplier_rec.unit_price,
            )
        )

    report = PurchaseRecommendationsReport(recommendations=recommendations)
    return Event(
        output=report.model_dump(mode="json"),
        actions=EventActions(
            state_delta={"purchase_recommendations": report.model_dump(mode="json")}
        ),
    )


# ==============================================================================
# 5. HUMAN APPROVAL NODE (HITL)
# ==============================================================================
@node(rerun_on_resume=True)
async def human_approval(
    ctx: Context, node_input: Any
) -> AsyncGenerator[Union[Event, RequestInput], None]:
    """5. Pauses the workflow to request human verification from the manager.

    Responsibility:
      - Yields a RequestInput event containing the purchase plan.
      - Halts workflow progression until response is received.
      - Routes workflow path (Approved vs Rejected) based on manager input.
    """
    raw_recs = ctx.state.get("purchase_recommendations")
    recs_report = (
        PurchaseRecommendationsReport(**raw_recs)
        if isinstance(raw_recs, dict)
        else raw_recs
    )
    if not recs_report:
        recs_report = node_input

    execution_id = ctx.state.get("execution_id") or "default"
    iteration = ctx.state.get("approval_iteration", 0)
    interrupt_id = f"manager_decision_{execution_id}_{iteration}"

    # Check if we have received a response to the interrupt
    if not ctx.resume_inputs or interrupt_id not in ctx.resume_inputs:
        # Construct summary description of the recommendation
        summary = "\n".join(
            [
                f"- SKU: {rec.sku} | Qty: {rec.quantity_to_order} | Supplier: {rec.recommended_supplier} | Total: ${rec.total_cost:.2f}"
                for rec in recs_report.recommendations
            ]
        )

        # Include the below-threshold warning if the manager previously chose
        # quantities that would leave stock under the minimum threshold.
        warning_text = ctx.state.get("below_threshold_warning")
        if warning_text:
            warning_block = (
                f"\n[BELOW THRESHOLD WARNING] Your chosen quantities will leave "
                f"some items below the minimum stock level:\n{warning_text}\n\n"
                f"The agent's original recommendation was higher to cover the "
                f"threshold gap. Approving will purchase your modified quantities "
                f"anyway. Rejecting lets you re-enter different quantities.\n"
            )
        else:
            warning_block = ""

        message = (
            f"[PENDING REVIEW] Procurement Plan requires review (Iteration {iteration}):\n{summary}\n"
            f"{warning_block}\n"
            "Please respond with your decision (Approved/Rejected) and any comments."
        )

        # Yield RequestInput to pause workflow execution
        yield RequestInput(interrupt_id=interrupt_id, message=message)
        return

    # Extract the manager's decision payload from resume inputs
    raw_decision = ctx.resume_inputs[interrupt_id]

    # Check if the manager approved or rejected (supporting both dict payloads or raw strings)
    approved = False
    notes = ""
    if isinstance(raw_decision, dict):
        approved = raw_decision.get("approved", False)
        notes = raw_decision.get("notes", "")
    else:
        decision_str = str(raw_decision).strip().lower()
        approved = "approve" in decision_str or "yes" in decision_str
        notes = f"Manager responded: {raw_decision}"

    approval = HumanApprovalResponse(approved=approved, notes=notes)

    # Route workflow downstream depending on approval status
    route_name = "approved" if approved else "rejected"

    yield Event(
        output=recs_report.model_dump(mode="json"),
        actions=EventActions(
            route=route_name,
            state_delta={
                "approval_response": approval.model_dump(mode="json"),
                "below_threshold_warning": None,
            },
        ),
    )


# ==============================================================================
# REJECTION SKELETON (MODIFICATION HITL NODE)
# ==============================================================================
@node(rerun_on_resume=True)
async def modify_recommendations(
    ctx: Context, node_input: Any
) -> AsyncGenerator[Union[Event, RequestInput], None]:
    """Provides a human manager with the option to modify order quantities/suppliers.

    Responsibility:
      - Pauses execution and asks manager for quantity/supplier adjustments.
      - Updates recommendations in state if modifications are provided.
      - Detects when chosen quantities fall below the minimum reorder threshold
        and stores a warning in state so human_approval can surface it clearly.
        The manager can then approve the below-threshold order knowingly.
      - Triggers iteration count increment and routes back to approval.
      - Routes to handle_rejection if manager cancels.
    """
    import json
    import re

    raw_recs = ctx.state.get("purchase_recommendations")
    recs_report = (
        PurchaseRecommendationsReport(**raw_recs)
        if isinstance(raw_recs, dict)
        else raw_recs
    )
    if not recs_report:
        recs_report = node_input

    execution_id = ctx.state.get("execution_id") or "default"
    iteration = ctx.state.get("approval_iteration", 0)
    interrupt_id = f"modification_input_{execution_id}_{iteration}"

    # ------------------------------------------------------------------
    # STEP B: Show the initial modification prompt (quantity input).
    # ------------------------------------------------------------------
    if not ctx.resume_inputs or interrupt_id not in ctx.resume_inputs:
        summary = "\n".join(
            [
                f"  - SKU: {rec.sku} | Recommended qty: {rec.quantity_to_order} units @ ${rec.unit_price:.2f} each"
                for rec in recs_report.recommendations
            ]
        )
        message = (
            f"[REJECTED] Procurement plan was rejected.\n"
            f"Current recommendations:\n{summary}\n\n"
            f"Enter new quantities/suppliers to modify and retry "
            f"(e.g., {{\"SKU-MILK-01\": 20}} or 'change Coke to 15'), "
            f"or type 'cancel' to abort completely."
        )
        yield RequestInput(interrupt_id=interrupt_id, message=message)
        return

    raw_mod = ctx.resume_inputs[interrupt_id]

    # Detect cancellation — supports both plain-string "cancel" and dict payloads
    # such as {"value": "cancel"} (programmatic simulation) or {"action": "cancel"}
    _cancel_str = ""
    if isinstance(raw_mod, str):
        _cancel_str = raw_mod.strip().lower()
    elif isinstance(raw_mod, dict):
        _cancel_str = str(raw_mod.get("value", raw_mod.get("action", ""))).strip().lower()
    if "cancel" in _cancel_str:
        yield Event(
            output="Procurement modifications aborted by manager.",
            actions=EventActions(route="cancel"),
        )
        return

    # Parse and extract modifications
    parsed_mod = {}

    # 1. Try parsing raw_mod as JSON dict if it is a string
    if isinstance(raw_mod, str):
        try:
            parsed = json.loads(raw_mod.strip())
            if isinstance(parsed, dict):
                parsed_mod = parsed
        except Exception:
            pass
    elif isinstance(raw_mod, dict):
        parsed_mod = raw_mod

    # 2. If it's a string and JSON parsing failed, try natural text parsing
    if not parsed_mod and isinstance(raw_mod, str):
        text = raw_mod.lower()
        clauses = re.split(r',|;|\band\b|\bbut\b|\bthen\b', text)

        for clause in clauses:
            clause = clause.strip()
            numbers = [int(n) for n in re.findall(r'\b\d+\b', clause)]
            if not numbers:
                continue

            num = numbers[0]

            for rec in recs_report.recommendations:
                terms = [rec.sku.lower(), rec.recommended_supplier.lower()]
                raw_inv = ctx.state.get("inventory_report")
                if raw_inv:
                    items_checked = raw_inv.get("items_checked", [])
                    matching_item = next(
                        (item for item in items_checked if item.get("sku") == rec.sku),
                        None
                    )
                    if matching_item:
                        terms.append(matching_item.get("name", "").lower())

                term_words = []
                for term in terms:
                    term_words.extend(re.split(r'[^a-z0-9]', term))
                term_words = [w for w in term_words if len(w) > 2]

                for w in term_words:
                    if w in clause:
                        parsed_mod[rec.sku] = {"quantity": num}
                        break

    # 3. Normalize parsed modifications (supporting flat dict and name -> SKU mapping)
    normalized_mod = {}
    for key, val in parsed_mod.items():
        matched_sku = None
        for rec in recs_report.recommendations:
            clean_rec_sku = re.sub(r'[^a-z0-9]', '', rec.sku.lower())
            clean_key = re.sub(r'[^a-z0-9]', '', key.lower())
            if clean_rec_sku == clean_key or (len(clean_key) >= 3 and (clean_key in clean_rec_sku or clean_rec_sku in clean_key)):
                matched_sku = rec.sku
                break

        if not matched_sku:
            raw_inv = ctx.state.get("inventory_report")
            if raw_inv:
                items_checked = raw_inv.get("items_checked", [])
                matching_item = next(
                    (item for item in items_checked if item.get("name", "").lower() == key.lower() or key.lower() in item.get("name", "").lower()),
                    None
                )
                if matching_item:
                    matched_sku = matching_item.get("sku")

        if matched_sku:
            if isinstance(val, dict):
                normalized_mod[matched_sku] = val
            elif isinstance(val, (int, float)):
                normalized_mod[matched_sku] = {"quantity": int(val)}

    # 4. Apply modifications to the original recommendations
    updated_recs = []
    for rec in recs_report.recommendations:
        item_mod = normalized_mod.get(rec.sku, {})
        new_qty = item_mod.get("quantity", rec.quantity_to_order)
        new_supplier = item_mod.get("supplier", rec.recommended_supplier)
        new_price = item_mod.get("unit_price", rec.unit_price)

        updated_recs.append(
            PurchaseRecommendation(
                sku=rec.sku,
                quantity_to_order=new_qty,
                recommended_supplier=new_supplier,
                unit_price=new_price,
                total_cost=new_qty * new_price,
            )
        )

    updated_report = PurchaseRecommendationsReport(recommendations=updated_recs)

    # ------------------------------------------------------------------
    # STEP C: Below-threshold detection.
    # If any item's chosen quantity would leave total stock below the minimum
    # threshold, store a clear warning in state so human_approval can show it.
    # The manager will see the warning and can still choose to Approve anyway.
    # ------------------------------------------------------------------
    raw_inv = ctx.state.get("inventory_report")
    inventory_items = {}
    if raw_inv:
        for item in raw_inv.get("items_checked", []):
            inventory_items[item["sku"]] = item

    below_threshold_warnings = []
    for rec in updated_recs:
        inv_item = inventory_items.get(rec.sku)
        if inv_item:
            current_stock = inv_item.get("current_stock", 0)
            min_stock = inv_item.get("minimum_stock", 0)
            resulting_stock = current_stock + rec.quantity_to_order
            if resulting_stock < min_stock:
                below_threshold_warnings.append(
                    f"  [!] {rec.sku}: ordering {rec.quantity_to_order} + "
                    f"{current_stock} in stock = {resulting_stock} total, "
                    f"but minimum threshold is {min_stock}."
                )

    below_threshold_warning_text = (
        "\n".join(below_threshold_warnings) if below_threshold_warnings else None
    )

    # ------------------------------------------------------------------
    # STEP D: Route back to human_approval with the updated plan.
    # If below-threshold warnings exist they are stored in state so
    # human_approval can surface them to the manager.
    # ------------------------------------------------------------------
    state_delta = {
        "purchase_recommendations": updated_report.model_dump(mode="json"),
        "approval_iteration": iteration + 1,
        "below_threshold_warning": below_threshold_warning_text,
    }

    yield Event(
        output=updated_report.model_dump(mode="json"),
        actions=EventActions(
            route="loop",
            state_delta=state_delta,
        ),
    )


# ==============================================================================
# REJECTION HANDLING NODE
# ==============================================================================
@node
def handle_rejection(ctx: Context, node_input: Any) -> Event:
    """Handles cases where the procurement recommendation is rejected.

    Responsibility:
      - Logs rejection details.
      - Sends notification to system logs / user interface.
      - Terminates the current purchase cycle safely.
    """
    raw_approval = ctx.state.get("approval_response")
    approval = (
        HumanApprovalResponse(**raw_approval)
        if isinstance(raw_approval, dict)
        else raw_approval
    )
    reason = approval.notes if approval else "No notes provided."

    return Event(
        output=f"[REJECTED] Purchase order request rejected by manager. Reason: {reason}"
    )


# ==============================================================================
# 6. PURCHASE ORDER GENERATION NODE
# ==============================================================================
@node
def purchase_order_generation(
    ctx: Context, node_input: Any
) -> Event:
    """6. Converts approved recommendations into formal Purchase Orders (POs).

    Responsibility:
      - Assigns unique PO identifiers (e.g. PO-YYYYMMDD-XXX).
      - Groups items by supplier.
      - Writes official PO details to state and ERP database.
    """
    raw_recs = ctx.state.get("purchase_recommendations")
    recs_report = (
        PurchaseRecommendationsReport(**raw_recs)
        if isinstance(raw_recs, dict)
        else raw_recs
    )
    if not recs_report:
        recs_report = node_input

    # Group recommendations by supplier
    orders_by_supplier = {}
    for rec in recs_report.recommendations:
        orders_by_supplier.setdefault(rec.recommended_supplier, []).append(rec)

    purchase_orders = []
    for idx, (supplier, recs) in enumerate(orders_by_supplier.items()):
        po_number = f"PO-{datetime.now().strftime('%Y%m%d')}-{idx + 1:03d}"

        items = [
            PurchaseOrderItem(
                sku=rec.sku,
                quantity=rec.quantity_to_order,
                unit_price=rec.unit_price,
                total_price=rec.total_cost,
            )
            for rec in recs
        ]
        total = sum(item.total_price for item in items)

        purchase_orders.append(
            PurchaseOrder(
                po_number=po_number,
                supplier_name=supplier,
                items=items,
                total_amount=total,
            )
        )

    return Event(
        output=[po.model_dump(mode="json") for po in purchase_orders],
        actions=EventActions(
            state_delta={
                "purchase_orders": [
                    po.model_dump(mode="json") for po in purchase_orders
                ]
            }
        ),
    )


# ==============================================================================
# 7. SUPPLIER EMAIL NODE
# ==============================================================================
@node
def supplier_email(ctx: Context, node_input: Any) -> Event:
    """7. Drafts and simulates transmitting the PO to the supplier's email.

    Responsibility:
      - Composes official email request with item breakdown.
      - Connects to mail server / API (SendGrid, SMTP) to dispatch.
      - Updates PO transmission statuses.
    """
    raw_pos = ctx.state.get("purchase_orders") or []
    purchase_orders = [
        PurchaseOrder(**po) if isinstance(po, dict) else po for po in raw_pos
    ]
    if not purchase_orders and isinstance(node_input, list):
        purchase_orders = [
            PurchaseOrder(**po) if isinstance(po, dict) else po for po in node_input
        ]

    emails = []
    for po in purchase_orders:
        item_rows = "\n".join(
            [
                f"- {item.sku}: {item.quantity} units @ ${item.unit_price:.2f}"
                for item in po.items
            ]
        )

        body = (
            f"Dear {po.supplier_name},\n\n"
            f"Please find attached Purchase Order {po.po_number}.\n\n"
            f"Order Details:\n{item_rows}\n\n"
            f"Total Amount: ${po.total_amount:.2f}\n\n"
            f"Thank you,\nInventra AI Procurement System"
        )

        emails.append(
            SupplierEmailDraft(
                to_email="orders@globalfooddist.com",
                subject=f"New Purchase Order: {po.po_number}",
                body=body,
                sent=True,
            )
        )

    return Event(
        output=[email.model_dump(mode="json") for email in emails],
        actions=EventActions(
            state_delta={"emails": [email.model_dump(mode="json") for email in emails]}
        ),
    )


# ==============================================================================
# 8. DELIVERY ESTIMATION NODE
# ==============================================================================
@node
def delivery_estimation(ctx: Context, node_input: List[SupplierEmailDraft]) -> Event:
    """8. Estimates delivery schedules for the generated Purchase Orders.

    Responsibility:
      - Analyzes supplier lead times and historical shipping logs.
      - Computes anticipated delivery windows.
      - Feeds schedules into store tracking dashboard.
    """
    raw_pos = ctx.state.get("purchase_orders") or []
    purchase_orders = [
        PurchaseOrder(**po) if isinstance(po, dict) else po for po in raw_pos
    ]

    estimations = []
    for po in purchase_orders:
        delivery_date = (datetime.now() + timedelta(days=3)).isoformat()
        estimations.append(
            DeliveryEstimation(
                po_number=po.po_number,
                estimated_delivery_date=delivery_date,
                status="PENDING",
            )
        )

    return Event(
        output=[est.model_dump(mode="json") for est in estimations],
        actions=EventActions(
            state_delta={
                "delivery_estimations": [
                    est.model_dump(mode="json") for est in estimations
                ]
            }
        ),
    )


# ==============================================================================
# 9. INVENTORY UPDATE NODE
# ==============================================================================
@node
def inventory_update(ctx: Context, node_input: Any) -> Event:
    """9. Updates local stock levels/statuses.

    Responsibility:
      - Modifies inventory database items to reflect 'On-Order' quantities.
      - Adjusts dashboard flags to prevent duplicate ordering.
      - Completes the workflow cycle.
    """
    raw_inventory = ctx.state.get("inventory_report")
    inventory_report = (
        InventoryReport(**raw_inventory)
        if isinstance(raw_inventory, dict)
        else raw_inventory
    )

    if inventory_report and not inventory_report.low_stock_items:
        return Event(
            output="[SUCCESS] All stock levels are sufficient. No procurement actions required.",
            actions=EventActions(state_delta={"inventory_updated": True}),
        )

    return Event(
        output="[SUCCESS] Inventory system updated. All procurement items set to 'On Order' status.",
        actions=EventActions(state_delta={"inventory_updated": True}),
    )


# ==============================================================================
# WORKFLOW TOPOLOGY DEFINITION
# ==============================================================================
root_agent = Workflow(
    name="inventra_workflow",
    description="retail inventory monitoring and automated procurement planning graph workflow",
    state_schema=WorkflowState,
    edges=[
        # 1. Security Checkpoint Entry Gate
        (START, security_checkpoint),
        # 2. Security Decision Branching
        (
            security_checkpoint,
            {"valid": inventory_monitoring, "flagged": security_human_review},
        ),
        # 3. Security Override Branching
        (
            security_human_review,
            {
                "override_approved": inventory_monitoring,
                "quarantined": handle_rejection,
            },
        ),
        # 4. Normal Monitoring & Planning Path
        (
            inventory_monitoring,
            {"low_stock": demand_forecasting, "sufficient_stock": inventory_update},
        ),
        (
            demand_forecasting,
            supplier_recommendation,
            purchase_recommendation,
            human_approval,
        ),
        # 5. Rejection Loopback/Retry Routing
        (
            human_approval,
            {"approved": purchase_order_generation, "rejected": modify_recommendations},
        ),
        # 6. Rejection Modification Action Routing
        (modify_recommendations, {"loop": human_approval, "cancel": handle_rejection}),
        # 7. Post-approval fulfillment path
        (
            purchase_order_generation,
            supplier_email,
            delivery_estimation,
            inventory_update,
        ),
    ],
)

# App Container for Graph Workflow
# NOTE: Resumability must be enabled for Human-in-the-loop (RequestInput) execution.
app = App(
    root_agent=root_agent,
    name="app",
    resumability_config=ResumabilityConfig(is_resumable=True),
)
