"""AI-call Lambda for the extract-document feature.

Fills the prompt template (baked in via the PROMPT_TEXT env var, see
modules/feature/lambda.tf) with the request input, and calls Bedrock via
the shared bedrock_helper layer. Supports three input modes:
  - s3_key: an uploaded file (see modules/core-engine/file-uploads.tf) -
    fetched from S3. A .xlsx or .csv is parsed directly into rows (no
    vision call needed, the data's already structured/tabular, same
    branching bookkeeping-query and analyze-reviews already do); a
    PDF/image is read directly by Claude's document/vision support. This
    is the only path real uploads should use: this route runs through
    Step Functions' StartSyncExecution, and Step Functions caps execution
    Input at a hard, non-negotiable 256 KB (an AWS service quota, not a
    Lambda/API Gateway limit) - a live test caught a ~600 KB phone photo
    failing with a 413 through the old document_base64-in-the-request-body
    path well before it ever reached Lambda's own (much larger) 6 MB
    invoke limit.
  - document_base64 + media_type: kept for small inline uploads/tests
    that stay comfortably under the 256 KB Step Functions ceiling.
  - document_text: plain text (existing behavior).
Returns the raw model JSON response for the next state (StoreResult) to
persist.
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

MAX_ROWS = 30


def _truncate(text: str):
    lines = [l for l in text.split("\n") if l.strip()]
    if len(lines) <= MAX_ROWS:
        return text, False, len(lines)
    return "\n".join(lines[:MAX_ROWS]), True, len(lines)


def lambda_handler(event, context):
    # event is the Step Functions execution input directly (the API
    # Gateway integration maps $request.body straight into it) - not an
    # API-Gateway-proxy-style {"body": "<json string>"} envelope. A live
    # test caught this: event.get("body") was always None, silently
    # producing an empty prompt.
    s3_key = event.get("s3_key")
    document_base64 = event.get("document_base64")
    media_type = event.get("media_type")

    if s3_key:
        file_bytes = read_s3_object(UPLOADS_BUCKET, s3_key)
        extension = os.path.splitext(s3_key.lower())[1]
        if extension in SPREADSHEET_PARSERS:
            raw_text = SPREADSHEET_PARSERS[extension](file_bytes)
            document_text, truncated, original_count = _truncate(raw_text)
            prompt = render_prompt(PROMPT_TEXT, document_text=document_text)
            result = invoke_model(prompt)
            trunc_note = f" — truncated to {MAX_ROWS} of {original_count} rows" if truncated else ""
            raw_input_summary = f"uploaded spreadsheet{trunc_note} ({s3_key})"
        else:
            media_type = guess_media_type(s3_key)
            prompt = render_file_mode_prompt(PROMPT_TEXT)
            result = invoke_model_with_file(prompt, base64.b64encode(file_bytes).decode(), media_type)
            raw_input_summary = f"uploaded {media_type} file"
    elif document_base64 and media_type:
        prompt = render_file_mode_prompt(PROMPT_TEXT)
        result = invoke_model_with_file(prompt, document_base64, media_type)
        raw_input_summary = f"uploaded {media_type} file"
    else:
        document_text = event.get("document_text", "")
        prompt = render_prompt(PROMPT_TEXT, document_text=document_text)
        result = invoke_model(prompt)
        raw_input_summary = document_text[:200]

    return {
        "raw_input_summary": raw_input_summary,
        "structured_result": result,
        "s3_key": s3_key,  # None for text/base64 paths; stored so the frontend can fetch a preview
    }
