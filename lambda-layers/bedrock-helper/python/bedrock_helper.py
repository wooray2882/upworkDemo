"""Shared Bedrock-call helper, packaged as a Lambda layer.

Every feature's AI-call Lambda imports this instead of writing its own
Bedrock client, retry logic, and JSON-response validation.
"""
import json
import time

import boto3

_client = boto3.client("bedrock-runtime")

MAX_RETRIES = 3
BACKOFF_SECONDS = 1.5


def load_prompt(path: str, **kwargs) -> str:
    with open(path, "r", encoding="utf-8") as f:
        template = f.read()
    for key, value in kwargs.items():
        template = template.replace(f"{{{{{key}}}}}", str(value))
    return template


def invoke_model(prompt: str, model_id: str | None = None) -> dict:
    """Calls Bedrock and returns parsed JSON. Retries on throttling/transient
    errors; raises ValueError if the model does not return valid JSON."""
    # Cross-region inference profile ID, not a direct on-demand model ID —
    # this account requires it for anthropic.claude-sonnet-4-6 (confirmed
    # via a live invoke-model test, not assumed).
    model_id = model_id or "us.anthropic.claude-sonnet-4-6"

    body = json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 1024,
        "messages": [{"role": "user", "content": prompt}],
    })

    last_error = None
    for attempt in range(MAX_RETRIES):
        try:
            response = _client.invoke_model(modelId=model_id, body=body)
            payload = json.loads(response["body"].read())
            text = payload["content"][0]["text"]
            return json.loads(text)
        except (json.JSONDecodeError, KeyError, IndexError) as exc:
            last_error = exc
            break  # malformed model output — retrying won't help
        except Exception as exc:  # throttling / transient AWS errors
            last_error = exc
            time.sleep(BACKOFF_SECONDS * (attempt + 1))

    raise ValueError(f"Bedrock call failed after retries: {last_error}")
