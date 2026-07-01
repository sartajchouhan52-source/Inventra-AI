"""
generate_traces.py - StockPilot AI Eval Trace Generator
========================================================
Runs all 10 evaluation scenarios through the live ADK workflow using
InMemoryRunner and serialises the resulting conversation traces into
artifacts/traces/generated_traces.json in the EvaluationDataset format
expected by `agents-cli eval grade`.

HITL simulation is fully deterministic (mirrors test_run.py patterns):
  - approve              -> approve on the first human_approval interrupt
  - quarantine           -> quarantine on the first security_human_review interrupt
  - reject_then_cancel   -> reject at human_approval, then cancel at modify_recommendations
  - reject_modify_approve-> reject at human_approval, supply modified quantities at
                           modify_recommendations, then approve at second human_approval

IMPORTANT: We do NOT gate on event.interrupted (which can be None in ADK 2.3.0).
Instead we check session state after each run_async call to determine if a HITL
pause occurred (same pattern as the working test_run.py).

Usage:
    uv run python tests/eval/generate_traces.py

Output:
    artifacts/traces/generated_traces.json
"""

import asyncio
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import nest_asyncio
from google.adk.runners import InMemoryRunner
from google.genai import types

# Allow nested event loops in environments that already have one
nest_asyncio.apply()

# ── Project root on sys.path ────────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PROJECT_ROOT))

from app.agent import app  # noqa: E402  (import after sys.path mutation)

# ── Output path ─────────────────────────────────────────────────────────────
TRACES_DIR = PROJECT_ROOT / "artifacts" / "traces"
TRACES_FILE = TRACES_DIR / "generated_traces.json"

# ── Dataset path ─────────────────────────────────────────────────────────────
DATASET_FILE = (
    PROJECT_ROOT / "tests" / "eval" / "datasets" / "basic-dataset.json"
)

# ── Agent name (must match App.name) ─────────────────────────────────────────
AGENT_NAME = "app"
USER_ID = "eval_runner"

SEP = "-" * 70


# ===========================================================================
# Low-level helpers
# ===========================================================================

def _make_text_content(text: str) -> types.Content:
    """Build a user Content with a text part — ADK 2.3.0 compatible."""
    return types.Content(role="user", parts=[types.Part(text=text)])


def _make_function_response_content(interrupt_id: str, response: Any) -> types.Content:
    """Build a resume Content containing a FunctionResponse for *interrupt_id*.

    FunctionResponse.response must be a dict in ADK 2.3.0 (pydantic validation).
    String responses are wrapped as {"value": response}.
    """
    if isinstance(response, str):
        response_dict: dict = {"value": response}
    elif isinstance(response, dict):
        response_dict = response
    else:
        response_dict = {"value": str(response)}
    return types.Content(
        role="user",
        parts=[
            types.Part(
                function_response=types.FunctionResponse(
                    name=interrupt_id,
                    id=interrupt_id,
                    response=response_dict,
                )
            )
        ],
    )


def _content_to_dict(content: types.Content | None) -> dict | None:
    """Serialise a google.genai Content to a plain dict for JSON output."""
    if content is None:
        return None
    parts = []
    for p in content.parts or []:
        if p.text:
            parts.append({"text": p.text})
        elif p.function_call:
            parts.append(
                {
                    "function_call": {
                        "name": p.function_call.name,
                        "args": dict(p.function_call.args or {}),
                    }
                }
            )
        elif p.function_response:
            resp = p.function_response.response
            parts.append(
                {
                    "function_response": {
                        "name": p.function_response.name,
                        "response": resp if isinstance(resp, dict) else {"value": str(resp)},
                    }
                }
            )
    return {"role": content.role, "parts": parts}


def _serialize_output(output: Any) -> str:
    """Safely serialise any node output (including Pydantic models, lists, and dicts) to a JSON string."""
    if output is None:
        return ""
    if isinstance(output, str):
        return output

    def to_serializable(obj: Any) -> Any:
        if hasattr(obj, "model_dump"):
            return obj.model_dump(mode="json")
        if isinstance(obj, list):
            return [to_serializable(item) for item in obj]
        if isinstance(obj, dict):
            return {k: to_serializable(v) for k, v in obj.items()}
        if hasattr(obj, "isoformat"):
            return obj.isoformat()
        return obj

    try:
        serializable_obj = to_serializable(output)
        if isinstance(serializable_obj, str):
            return serializable_obj
        return json.dumps(serializable_obj, ensure_ascii=False)
    except Exception:
        return str(output)


async def _run_and_collect(
    runner: InMemoryRunner,
    session_id: str,
    message: types.Content,
) -> list[dict]:
    """Run one runner.run_async call and return collected agent event dicts."""
    events = []
    async for event in runner.run_async(
        user_id=USER_ID,
        session_id=session_id,
        new_message=message,
    ):
        # 1. Capture node execution name if present
        if event.node_info and event.node_info.path:
            try:
                node_name = event.node_info.path.split('/')[-1].split('@')[0]
                text_content = {
                    "role": "model",
                    "parts": [{"text": f"Node executed: {node_name}"}]
                }
                events.append({"author": AGENT_NAME, "content": text_content})
            except Exception:
                pass

        # 2. Capture content if present (RequestInput, messages)
        ev_dict = _content_to_dict(event.content)
        if ev_dict and ev_dict.get("parts"):
            events.append({"author": AGENT_NAME, "content": ev_dict})

        # 3. Capture output if present (node outputs)
        if event.output is not None:
            output_str = _serialize_output(event.output)
            text_content = {
                "role": "model",
                "parts": [{"text": f"Node Output: {output_str}"}]
            }
            events.append({"author": AGENT_NAME, "content": text_content})
    return events


async def _get_state(runner: InMemoryRunner, session_id: str) -> dict:
    """Read current session state as a plain dict."""
    state_obj = await runner.session_service.get_session(
        app_name=AGENT_NAME, user_id=USER_ID, session_id=session_id
    )
    return dict(state_obj.state)


def _events_to_turn(turn_index: int, events: list[dict]) -> dict:
    return {"turn_index": turn_index, "events": events}


def _extract_final_text(all_turns: list[dict]) -> str:
    """Return the last non-empty text part across all agent events."""
    last_text = ""
    for turn in all_turns:
        for ev in turn.get("events", []):
            if ev.get("author") == "user":
                continue
            for p in ev.get("content", {}).get("parts", []):
                if "text" in p and p["text"]:
                    last_text = p["text"]
    return last_text


# ===========================================================================
# Core scenario runner
# ===========================================================================

async def run_scenario(
    runner: InMemoryRunner,
    eval_case_id: str,
    prompt_text: str,
    hitl_simulation: str,
    hitl_override_quantities: dict | None = None,
) -> list[dict]:
    """
    Run a single scenario and return a list of turn dicts for agent_data.turns.

    Strategy: After each run_async, inspect session state to determine
    whether a HITL pause occurred (presence of execution_id + pending state).
    This avoids relying on event.interrupted which may be None in ADK 2.3.0.
    """
    print("")
    print(SEP)
    print(f"  Running: {eval_case_id}  [{hitl_simulation}]")
    print(SEP)

    session = await runner.session_service.create_session(
        app_name=AGENT_NAME, user_id=USER_ID
    )
    sid = session.id
    all_turns: list[dict] = []

    # ── Turn 0: initial user message ─────────────────────────────────────────
    initial_msg = _make_text_content(prompt_text)
    turn0_events = [{"author": "user", "content": _content_to_dict(initial_msg)}]
    agent_events = await _run_and_collect(runner, sid, initial_msg)
    turn0_events.extend(agent_events)
    all_turns.append(_events_to_turn(0, turn0_events))

    state = await _get_state(runner, sid)
    execution_id = state.get("execution_id", "default")
    has_recs = state.get("purchase_recommendations") is not None
    has_security = state.get("security_event") is not None
    has_inventory = state.get("inventory_report") is not None
    print(f"  State after T0: exec_id={execution_id} | recs={has_recs} | sec={has_security} | inv={has_inventory}")

    # ── No HITL path ─────────────────────────────────────────────────────────
    if hitl_simulation == "none":
        print("  -> No HITL required. Done.")
        return all_turns

    # ── Security HITL (quarantine or override) ────────────────────────────────
    if hitl_simulation == "quarantine" and has_security:
        interrupt_id = f"security_action_{execution_id}"
        resume = _make_function_response_content(interrupt_id, {"action": "quarantine"})
        t1_events = [{"author": "user", "content": _content_to_dict(resume)}]
        t1_events.extend(await _run_and_collect(runner, sid, resume))
        all_turns.append(_events_to_turn(1, t1_events))
        print(f"  -> Security: quarantined")
        return all_turns

    if hitl_simulation == "quarantine" and not has_security:
        # Security didn't fire (shouldn't happen if payload is correct)
        print("  -> WARNING: Expected security event but none found. Returning as-is.")
        return all_turns

    # ── Manager approval paths ────────────────────────────────────────────────
    if not has_recs:
        print(f"  -> WARNING: Expected purchase_recommendations in state but none found.")
        return all_turns

    if hitl_simulation == "approve":
        # Approve on first HITL
        interrupt_id = f"manager_decision_{execution_id}_0"
        resume = _make_function_response_content(
            interrupt_id, {"approved": True, "notes": "Approved by automated eval harness"}
        )
        t1_events = [{"author": "user", "content": _content_to_dict(resume)}]
        t1_events.extend(await _run_and_collect(runner, sid, resume))
        all_turns.append(_events_to_turn(1, t1_events))
        print(f"  -> Manager: approved (iteration 0)")

    elif hitl_simulation == "reject_then_cancel":
        # Step 1: reject
        interrupt_id = f"manager_decision_{execution_id}_0"
        resume_reject = _make_function_response_content(
            interrupt_id, {"approved": False, "notes": "Quantities not justified. Cancelling."}
        )
        t1_events = [{"author": "user", "content": _content_to_dict(resume_reject)}]
        t1_events.extend(await _run_and_collect(runner, sid, resume_reject))
        all_turns.append(_events_to_turn(1, t1_events))
        print(f"  -> Manager: rejected (iteration 0)")

        # Step 2: cancel
        interrupt_id_mod = f"modification_input_{execution_id}_0"
        resume_cancel = _make_function_response_content(interrupt_id_mod, "cancel")
        t2_events = [{"author": "user", "content": _content_to_dict(resume_cancel)}]
        t2_events.extend(await _run_and_collect(runner, sid, resume_cancel))
        all_turns.append(_events_to_turn(2, t2_events))
        print(f"  -> Manager: cancelled procurement")

    elif hitl_simulation == "reject_modify_approve":
        # Step 1: reject
        interrupt_id = f"manager_decision_{execution_id}_0"
        resume_reject = _make_function_response_content(
            interrupt_id, {"approved": False, "notes": "Quantities too high, will modify."}
        )
        t1_events = [{"author": "user", "content": _content_to_dict(resume_reject)}]
        t1_events.extend(await _run_and_collect(runner, sid, resume_reject))
        all_turns.append(_events_to_turn(1, t1_events))
        print(f"  -> Manager: rejected (iteration 0)")

        # Step 2: submit modifications
        state2 = await _get_state(runner, sid)
        raw_recs = state2.get("purchase_recommendations", {})
        recs_list = raw_recs.get("recommendations", [])

        if hitl_override_quantities:
            mod_payload = hitl_override_quantities
        else:
            mod_payload = {
                rec["sku"]: max(5, rec["quantity_to_order"] // 2)
                for rec in recs_list
            }

        interrupt_id_mod = f"modification_input_{execution_id}_0"
        resume_mod = _make_function_response_content(interrupt_id_mod, mod_payload)
        t2_events = [{"author": "user", "content": _content_to_dict(resume_mod)}]
        t2_events.extend(await _run_and_collect(runner, sid, resume_mod))
        all_turns.append(_events_to_turn(2, t2_events))
        print(f"  -> Modifications submitted: {mod_payload}")

        # Step 3: approve modified plan
        interrupt_id_approve = f"manager_decision_{execution_id}_1"
        resume_approve = _make_function_response_content(
            interrupt_id_approve,
            {"approved": True, "notes": "Modified quantities look correct. Approved."},
        )
        t3_events = [{"author": "user", "content": _content_to_dict(resume_approve)}]
        t3_events.extend(await _run_and_collect(runner, sid, resume_approve))
        all_turns.append(_events_to_turn(3, t3_events))
        print(f"  -> Manager: approved modified plan (iteration 1)")

    else:
        print(f"  -> Unknown hitl_simulation: {hitl_simulation!r}")

    total_events = sum(len(t["events"]) for t in all_turns)
    print(f"  + Captured {total_events} events across {len(all_turns)} turns")
    return all_turns


# ===========================================================================
# Main driver
# ===========================================================================

async def main() -> None:
    print("=" * 70)
    print("  StockPilot AI - Eval Trace Generator")
    print(f"  Dataset : {DATASET_FILE}")
    print(f"  Output  : {TRACES_FILE}")
    print(f"  Started : {datetime.now(timezone.utc).isoformat()}")
    print("=" * 70)

    dataset = json.loads(DATASET_FILE.read_text(encoding="utf-8"))
    TRACES_DIR.mkdir(parents=True, exist_ok=True)
    runner = InMemoryRunner(app=app)
    output_cases: list[dict] = []

    for case in dataset["eval_cases"]:
        eval_case_id = case["eval_case_id"]
        meta = case.get("eval_case_metadata", {})
        prompt_text = case["prompt"]["parts"][0]["text"]
        hitl_simulation = meta.get("hitl_simulation", "none")
        override_quantities = meta.get("hitl_override_quantities")

        turns = await run_scenario(
            runner=runner,
            eval_case_id=eval_case_id,
            prompt_text=prompt_text,
            hitl_simulation=hitl_simulation,
            hitl_override_quantities=override_quantities,
        )

        final_text = _extract_final_text(turns)
        output_cases.append({
            "eval_case_id": eval_case_id,
            "eval_case_metadata": meta,
            "prompt": case["prompt"],
            "responses": [
                {
                    "response": {
                        "role": "model",
                        "parts": [{"text": final_text or "[No text output]"}],
                    }
                }
            ],
            "agent_data": {
                "agents": {
                    AGENT_NAME: {
                        "agent_id": AGENT_NAME,
                        "agent_type": "WorkflowAgent",
                        "instruction": "StockPilot AI: Inventory Monitoring and Automated Procurement Workflow",
                    }
                },
                "turns": turns,
            },
        })

    # Write output FIRST (before any print that could fail)
    output_dataset = {"eval_cases": output_cases}
    TRACES_FILE.write_text(
        json.dumps(output_dataset, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    print("")
    print("=" * 70)
    print(f"  DONE - {len(output_cases)} traces written to:")
    print(f"  {TRACES_FILE}")
    print(f"  Completed: {datetime.now(timezone.utc).isoformat()}")
    print("=" * 70)
    print("")


if __name__ == "__main__":
    asyncio.run(main())
