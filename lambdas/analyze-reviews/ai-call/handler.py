"""AI-call Lambda for the analyze-reviews feature.

Reads a batch of customer reviews, calls Bedrock via the shared helper layer
using the review-analyzer prompt, and returns the structured sentiment/theme
result for the next state (StoreResult) to persist.

Supports two input modes:
  - reviews_text: plain text (existing behavior)
  - s3_key: an uploaded file (see modules/core-engine/file-uploads.tf) - a
    .xlsx or .csv review export is parsed directly into rows; a PDF/image
    (e.g. an exported review report) is read directly by Claude's
    document/vision support, same as extract-document - no Textract involved.
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


def lambda_handler(event, context):
    # event is the Step Functions execution input directly, not an
    # API-Gateway-proxy-style {"body": "<json string>"} envelope.
    s3_key = event.get("s3_key")

    if s3_key:
        file_bytes = read_s3_object(UPLOADS_BUCKET, s3_key)
        extension = os.path.splitext(s3_key.lower())[1]
        if extension in SPREADSHEET_PARSERS:
            reviews_text = SPREADSHEET_PARSERS[extension](file_bytes)
            prompt = render_prompt(PROMPT_TEXT, reviews_text=reviews_text)
            result = invoke_model(prompt)
            raw_input_summary = f"uploaded review export ({s3_key})"
        else:
            media_type = guess_media_type(s3_key)
            prompt = render_file_mode_prompt(PROMPT_TEXT)
            result = invoke_model_with_file(prompt, base64.b64encode(file_bytes).decode(), media_type)
            raw_input_summary = f"uploaded {media_type} review document"
    else:
        reviews_text = event.get("reviews_text", "")
        prompt = render_prompt(PROMPT_TEXT, reviews_text=reviews_text)
        result = invoke_model(prompt)
        raw_input_summary = f"{result.get('review_count', '?')} reviews analyzed"

    return {
        "raw_input_summary": raw_input_summary,
        "structured_result": result,
    }
