"""Shared Bedrock-call helper, packaged as a Lambda layer.

Every feature's AI-call Lambda imports this instead of writing its own
Bedrock client, retry logic, and JSON-response validation. Also carries the
shared file-ingestion helpers (S3 fetch + xlsx parsing) used when a request
carries an uploaded file (s3_key) instead of raw text/base64 - see
docs/architecture.md "File ingestion".
"""
import io
import json
import re
import time
from decimal import Decimal

import boto3
import openpyxl

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


def _call_bedrock(content, model_id: str | None = None) -> str:
    """Calls Bedrock with the given Anthropic Messages `content` (a string
    for plain text, or a list of content blocks for multimodal input) and
    returns the raw text response. Retries on throttling/transient errors."""
    model_id = model_id or DEFAULT_MODEL_ID

    body = json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        # 1024 was too low: a full MAX_ROWS (20-row) batch, pretty-printed
        # as JSON, commonly runs well past 130 lines and got cut off
        # mid-object - the response was truncated, not malformed, and that
        # surfaced downstream as "did not return valid JSON". 4096 gives a
        # 20-record batch (any of the three features' schemas) comfortable
        # headroom without materially changing response latency.
        "max_tokens": 4096,
        "messages": [{"role": "user", "content": content}],
    })

    last_error = None
    for attempt in range(MAX_RETRIES):
        try:
            response = _client.invoke_model(modelId=model_id, body=body)
            payload = json.loads(response["body"].read())
            return payload["content"][0]["text"]
        except (KeyError, IndexError) as exc:
            last_error = exc
            break  # unexpected response shape — retrying won't help
        except Exception as exc:  # throttling / transient AWS errors
            last_error = exc
            time.sleep(BACKOFF_SECONDS * (attempt + 1))

    raise ValueError(f"Bedrock call failed after retries: {last_error}")


def _invoke(content, model_id: str | None = None) -> dict:
    """Calls Bedrock and parses the response as JSON. Raises ValueError if
    the model does not return valid JSON."""
    text = _call_bedrock(content, model_id)
    try:
        return json.loads(_strip_code_fences(text))
    except json.JSONDecodeError as exc:
        raise ValueError(f"Bedrock did not return valid JSON: {exc}") from exc


def invoke_model(prompt: str, model_id: str | None = None) -> dict:
    """Calls Bedrock with a plain-text prompt and returns parsed JSON."""
    return _invoke(prompt, model_id)


def invoke_model_text(prompt: str, model_id: str | None = None) -> str:
    """Calls Bedrock with a plain-text prompt and returns the raw text
    response (for conversational answers, not structured extraction)."""
    return _call_bedrock(prompt, model_id)


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


_TRAILING_INPUT_BLOCK_RE = re.compile(r"\n[A-Za-z ]+:\s*\n-{3,}\s*\n\{\{\w+\}\}\s*\n-{3,}\s*$")


def render_file_mode_prompt(template: str) -> str:
    """Strips the trailing "<Label>: --- {{placeholder}} ---" input block
    every feature prompt ends with (e.g. "Document text:", "Transaction
    batch:", "Reviews:" - the label text varies per feature, so this
    matches the shape, not one hardcoded label) and appends a note that
    the document is attached directly, for use with invoke_model_with_file().
    Originally hardcoded to "Document text:" only, which silently left an
    unfilled {{transactions_text}} placeholder in the prompt for any other
    feature - caught before it shipped by checking every prompts/*.txt file,
    not assumed from the one feature (extract-document) it was written for."""
    instructions = _TRAILING_INPUT_BLOCK_RE.sub("", template).rstrip()
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


_s3 = boto3.client("s3")


def read_s3_object(bucket: str, key: str) -> bytes:
    """Fetches an uploaded file from the shared uploads bucket (see
    modules/core-engine/file-uploads.tf). Used by feature ai-call Lambdas
    when the request carries an s3_key instead of raw text/base64."""
    response = _s3.get_object(Bucket=bucket, Key=key)
    return response["Body"].read()


_EXTENSION_MEDIA_TYPES = {
    "pdf": "application/pdf",
    "png": "image/png",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "webp": "image/webp",
}


def guess_media_type(file_name: str) -> str:
    """Maps a file extension to the media type invoke_model_with_file()
    expects. Uploaded files only ever reach this via the presigned-upload
    path (modules/core-engine/file-uploads.tf), which accepts pdf/image/
    xlsx only, so an unrecognized extension is a real error, not silently
    guessed at."""
    extension = file_name.rsplit(".", 1)[-1].lower() if "." in file_name else ""
    if extension not in _EXTENSION_MEDIA_TYPES:
        raise ValueError(f"Unsupported file type: .{extension}")
    return _EXTENSION_MEDIA_TYPES[extension]


def parse_xlsx_rows(file_bytes: bytes) -> str:
    """Reads every row of the first sheet of an uploaded .xlsx into a
    plain-text line per row (comma-separated cell values) - the same shape
    a user would have typed by hand, so it feeds straight into the
    existing render_prompt() text-mode path with no prompt changes."""
    workbook = openpyxl.load_workbook(io.BytesIO(file_bytes), read_only=True, data_only=True)
    sheet = workbook.active
    lines = []
    for row in sheet.iter_rows(values_only=True):
        cells = [str(cell) for cell in row if cell is not None]
        if cells:
            lines.append(", ".join(cells))
    return "\n".join(lines)


def parse_csv_rows(file_bytes: bytes) -> str:
    """A .csv (e.g. exported from Google Sheets) is already plain text -
    just decode it. Feeds into the same render_prompt() text-mode path as
    parse_xlsx_rows(), no separate CSV-specific parsing needed."""
    return file_bytes.decode("utf-8", errors="replace").strip()
