.PHONY: install playground run-ambient generate-traces grade

install:
	uv sync

playground:
	uv run adk web . --port 8000

# Start the ambient event-driven service on port 8080.
# The ADK Playground web UI is available at http://localhost:8080/dev-ui
# and the Pub/Sub trigger endpoint is at:
#   POST http://localhost:8080/apps/app/trigger/pubsub
run-ambient:
	uv run uvicorn app.fast_api_app:app --host 0.0.0.0 --port 8080 --reload

# Run all 10 eval scenarios through the live ADK workflow and capture traces.
# Handles HITL simulation deterministically (approve / quarantine / reject / modify).
# Output: artifacts/traces/generated_traces.json
generate-traces:
	uv run python tests/eval/generate_traces.py

# Grade the generated traces with LLM-as-judge and code metrics.
# Reads: artifacts/traces/generated_traces.json
# Reads metrics from: tests/eval/eval_config.yaml
# Output: artifacts/grade_results/results_<timestamp>.{json,html}
grade:
	uv run agents-cli eval grade --traces artifacts/traces/generated_traces.json --config tests/eval/eval_config.yaml
