"""Shared Bedrock-call helper, packaged as a Lambda layer.

Every feature's AI-call Lambda imports this instead of writing its own
Bedrock client, retry logic, and JSON-response validation.
"""
import json
import re
import time
from decimal import Decimal

import boto3

_CODE_FENCE_RE = re.compile(r"^```(?:json)?\s*|\s*```$", re.MULTILINE)


def _strip_code_fences(text: str) -> str:
    """Claude models frequently wrap JSON output in ```json ... ``` fences
    even when explicitly told to return only JSON. Confirmed via a live
    invoke-model call against us.anthropic.claude-sonnet-4-6."""
    return _CODE_FENCE_RE.sub("", text.strip()).strip()

_client = boto3.client("bedrock-runtime")

MAX_RETRIES = 3
BACKOFF_SECONDS = 1.5


def render_prompt(template: str, **kwargs) -> str:
    """Fills {{placeholder}} tokens in a prompt template string. Feature
    Lambdas get the template text via the PROMPT_TEXT env var (baked in at
    terraform apply time, see modules/feature/lambda.tf) rather than reading
    a file at runtime — the prompts/ directory is a local, Terraform-side
    path and does not exist inside the deployed Lambda package."""
    for key, value in kwargs.items():
        template = template.replace(f"{{{{{key}}}}}", str(value))
    return template


# Cross-region inference profile ID, not a direct on-demand model ID - this
# account requires it for anthropic.claude-sonnet-4-6 (confirmed via a live
# invoke-model test, not assumed). Also confirmed (live) to support "image"
# and "document" (PDF) content blocks directly - no separate OCR/Textract
# step needed for document understanding.
DEFAULT_MODEL_ID = "us.anthropic.claude-sonnet-4-6"

# API Gateway (10 MB) and Lambda synchronous invoke (6 MB) both cap the
# request/response payload; base64 adds ~33% overhead. Capped conservatively
# below the Lambda limit so a failure surfaces as a clear error instead of
# an opaque platform-level payload rejection.
MAX_FILE_BASE64_BYTES = 4_500_000


def _invoke(content, model_id: str | None = None) -> dict:
    """Calls Bedrock with the given Anthropic Messages `content` (a string
    for plain text, or a list of content blocks for multimodal input) and
    returns parsed JSON. Retries on throttling/transient errors; raises
    ValueError if the model does not return valid JSON."""
    model_id = model_id or DEFAULT_MODEL_ID

    body = json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 1024,
        "messages": [{"role": "user", "content": content}],
    })

    last_error = None
    for attempt in range(MAX_RETRIES):
        try:
            response = _client.invoke_model(modelId=model_id, body=body)
            payload = json.loads(response["body"].read())
            text = payload["content"][0]["text"]
            return json.loads(_strip_code_fences(text))
        except (json.JSONDecodeError, KeyError, IndexError) as exc:
            last_error = exc
            break  # malformed model output — retrying won't help
        except Exception as exc:  # throttling / transient AWS errors
            last_error = exc
            time.sleep(BACKOFF_SECONDS * (attempt + 1))

    raise ValueError(f"Bedrock call failed after retries: {last_error}")


def invoke_model(prompt: str, model_id: str | None = None) -> dict:
    """Calls Bedrock with a plain-text prompt and returns parsed JSON."""
    return _invoke(prompt, model_id)


def invoke_model_with_file(
    prompt: str, file_base64: str, media_type: str, model_id: str | None = None
) -> dict:
    """Calls Bedrock with an uploaded file (PDF or image) plus an
    instruction prompt, letting Claude read the document directly - this
    IS the OCR/document-understanding step, confirmed via live
    invoke-model tests against both application/pdf and image/png."""
    if len(file_base64) > MAX_FILE_BASE64_BYTES:
        raise ValueError(
            f"Uploaded file is too large ({len(file_base64)} base64 bytes, "
            f"max {MAX_FILE_BASE64_BYTES}) — Lambda's synchronous invoke "
            "payload limit is 6 MB."
        )

    block_type = "document" if media_type == "application/pdf" else "image"
    content = [
        {"type": block_type, "source": {"type": "base64", "media_type": media_type, "data": file_base64}},
        {"type": "text", "text": prompt},
    ]
    return _invoke(content, model_id)


def render_file_mode_prompt(template: str) -> str:
    """Strips the trailing "Document text: --- {{document_text}} ---" block
    used for text-mode prompts and appends a note that the document is
    attached directly, for use with invoke_model_with_file()."""
    marker = template.find("Document text:")
    instructions = template[:marker].rstrip() if marker != -1 else template.rstrip()
    return instructions + "\n\nThe document is attached below as a file (PDF or image). Read it directly."


def to_dynamodb_safe(value):
    """Recursively converts float -> Decimal so boto3's DynamoDB resource
    API accepts it (it rejects native Python floats outright). Bedrock's
    JSON responses commonly include float fields (e.g. amounts) - a live
    test against the bookkeeping-query feature caught
    `TypeError: Float types are not supported. Use Decimal types instead.`"""
    if isinstance(value, float):
        return Decimal(str(value))
    if isinstance(value, dict):
        return {k: to_dynamodb_safe(v) for k, v in value.items()}
    if isinstance(value, list):
        return [to_dynamodb_safe(v) for v in value]
    return value
