"""AI-call Lambda for the bookkeeping-query feature.

Extracts structured transaction records from a raw batch of receipts/
transactions via the shared Bedrock helper layer. This is the ingestion
side of the feature — the conversational "ask questions about my spend"
side is served separately by querying the shared RAG knowledge base
(see docs/architecture.md, "Validating the design: bookkeeping/revenue
tracker").

Supports two input modes:
  - transactions_text: plain text (existing behavior)
  - s3_key: an uploaded file (see modules/core-engine/file-uploads.tf) - a
    .xlsx or .csv expense sheet is parsed directly into rows (no AI call
    needed for extraction, since the data's already structured); a
    PDF/image receipt is read directly by Claude's document/vision
    support, same as extract-document already does - no Textract involved.
"""
import base64
import os

from bedrock_helper import (
    guess_media_type,
    invoke_model,
    invoke_model_with_file,
    parse_csv_rows,
    parse_xlsx_rows,
    read_s3_object,
    render_file_mode_prompt,
    render_prompt,
)

PROMPT_TEXT = os.environ["PROMPT_TEXT"]
UPLOADS_BUCKET = os.environ.get("UPLOADS_BUCKET")
SPREADSHEET_PARSERS = {".xlsx": parse_xlsx_rows, ".csv": parse_csv_rows}

# Hard cap for demo speed: keeps the Bedrock prompt small so each upload
# processes in a few seconds. Raise this for a production build once the
# Step Functions / Lambda timeouts have been tuned for larger payloads.
MAX_ROWS = 20


def _truncate(text: str):
    """Keeps at most MAX_ROWS non-empty lines (header counts as one).
    Returns (truncated_text, was_truncated, original_line_count)."""
    lines = [l for l in text.split("\n") if l.strip()]
    if len(lines) <= MAX_ROWS:
        return text, False, len(lines)
    return "\n".join(lines[:MAX_ROWS]), True, len(lines)


def lambda_handler(event, context):
    # event is the Step Functions execution input directly, not an
    # API-Gateway-proxy-style {"body": "<json string>"} envelope.
    s3_key = event.get("s3_key")

    if s3_key:
        file_bytes = read_s3_object(UPLOADS_BUCKET, s3_key)
        extension = os.path.splitext(s3_key.lower())[1]
        if extension in SPREADSHEET_PARSERS:
            raw_text = SPREADSHEET_PARSERS[extension](file_bytes)
            transactions_text, truncated, original_count = _truncate(raw_text)
            prompt = render_prompt(PROMPT_TEXT, transactions_text=transactions_text)
            result = invoke_model(prompt)
            trunc_note = f" — truncated to {MAX_ROWS} of {original_count} rows" if truncated else ""
            raw_input_summary = f"uploaded expense sheet{trunc_note} ({s3_key})"
        else:
            media_type = guess_media_type(s3_key)
            prompt = render_file_mode_prompt(PROMPT_TEXT)
            result = invoke_model_with_file(prompt, base64.b64encode(file_bytes).decode(), media_type)
            raw_input_summary = f"uploaded {media_type} receipt"
    else:
        transactions_text = event.get("transactions_text", "")
        prompt = render_prompt(PROMPT_TEXT, transactions_text=transactions_text)
        result = invoke_model(prompt)
        raw_input_summary = f"{result.get('transaction_count', '?')} transactions extracted"

    return {
        "raw_input_summary": raw_input_summary,
        "structured_result": result,
    }
