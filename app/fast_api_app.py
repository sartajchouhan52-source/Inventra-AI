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

"""Ambient FastAPI entry point for Inventra AI.

This module turns Inventra AI into an **event-driven** service:

* Exposes the ADK's built-in ``/apps/{app_name}/trigger/pubsub`` endpoint,
  which accepts Pub/Sub push-subscription payloads and feeds each message
  directly into the procurement workflow.
* A subscription-normalization middleware rewrites fully-qualified Pub/Sub
  subscription names (``projects/<p>/subscriptions/<name>``) to their short
  form (``<name>``).  The ADK trigger handler derives the session ``user_id``
  from the subscription field, so keeping it short makes session records and
  logs easy to read.
* Telemetry is local-only (``otel_to_cloud=False``).
* All console output uses standard Python logging — no Cloud Logging client.
* The ADK Playground (web UI) is preserved so executions can be inspected.

Running locally
---------------
    uv run uvicorn app.fast_api_app:app --host 0.0.0.0 --port 8080
Or via the Makefile:
    make run-ambient
"""

import json
import logging
import os

import uvicorn
from fastapi import FastAPI
from google.adk.cli.fast_api import get_fast_api_app
from starlette.requests import Request

# ---------------------------------------------------------------------------
# Standard Python logging — no Cloud Logging client needed locally.
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Path configuration
# ---------------------------------------------------------------------------
# The ADK needs the project root as agents_dir so it discovers the
# "app" package (containing agent.py + __init__.py) as an agent module.
AGENT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

allow_origins = (
    os.getenv("ALLOW_ORIGINS", "").split(",") if os.getenv("ALLOW_ORIGINS") else None
)

# ---------------------------------------------------------------------------
# Build the FastAPI application via the ADK helper.
#
# Key flags:
#   web=True              → keeps the ADK Playground UI available so you can
#                           inspect executions triggered by Pub/Sub events.
#   trigger_sources=["pubsub"]
#                         → registers /apps/{app_name}/trigger/pubsub which
#                           decodes the base64 Pub/Sub payload and feeds the
#                           JSON data directly into runner.run_async().
#   otel_to_cloud=False   → console-only telemetry; no GCP credentials needed.
# ---------------------------------------------------------------------------
app: FastAPI = get_fast_api_app(
    agents_dir=AGENT_DIR,
    web=True,
    trigger_sources=["pubsub"],
    allow_origins=allow_origins,
    session_service_uri=None,   # in-memory sessions
    artifact_service_uri=None,  # in-memory artifacts
    otel_to_cloud=False,
)
app.title = "Inventra AI – Ambient Event Service"
app.description = (
    "Event-driven Inventra AI procurement workflow. "
    "POST a Pub/Sub push payload to /apps/app/trigger/pubsub to start a run."
)


# ---------------------------------------------------------------------------
# Subscription-normalization middleware
#
# Pub/Sub push notifications include a fully-qualified subscription path:
#   { "subscription": "projects/my-project/subscriptions/inventory-updates-sub" }
#
# The ADK trigger handler uses this value (with slashes replaced by "--") as
# the session user_id. Normalizing to the short name keeps records clean:
#   inventory-updates-sub  →  inventory-updates-sub
# ---------------------------------------------------------------------------
@app.middleware("http")
async def normalize_pubsub_subscription(request: Request, call_next):  # type: ignore[no-untyped-def]
    """Rewrite ``projects/.../subscriptions/NAME`` → ``NAME`` in push bodies.

    Applied only to POST requests that end with ``/trigger/pubsub`` so all
    other traffic passes through unmodified.
    """
    if request.url.path.endswith("/trigger/pubsub") and request.method == "POST":
        body = await request.body()
        try:
            data = json.loads(body)
            sub = data.get("subscription", "")
            if "/" in sub:
                short_name = sub.rsplit("/", 1)[-1]
                logger.info(
                    "Normalizing subscription path '%s' → '%s'", sub, short_name
                )
                data["subscription"] = short_name
                # Overwrite the cached body so downstream handlers see the
                # normalized payload.
                request._body = json.dumps(data).encode()  # type: ignore[attr-defined]
        except (json.JSONDecodeError, KeyError):
            # Non-JSON body or missing key — pass through unchanged.
            pass
    return await call_next(request)


# ---------------------------------------------------------------------------
# Health-check endpoint (optional – ADK also registers /health)
# ---------------------------------------------------------------------------
@app.get("/ping")
async def ping() -> dict:
    """Liveness probe — returns immediately without touching the agent."""
    return {"status": "ok", "service": "inventra-ai-ambient"}


# ---------------------------------------------------------------------------
# Local entrypoint
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 8080)),
        log_level="info",
    )
