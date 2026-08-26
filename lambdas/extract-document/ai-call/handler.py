"""AI-call Lambda for the extract-document feature.

Fills the prompt template (baked in via the PROMPT_TEXT env var, see
modules/feature/lambda.tf) with the request input, and calls Bedrock via
the shared bedrock_helper layer. Supports two input modes:
  - document_text: plain text (existing behavior)
  - document_base64 + media_type: an uploaded PDF or image, read directly
    by Claude's native document/vision support (this is the OCR step -
    no separate Textract/OCR service involved, confirmed via live
    invoke-model tests against both application/pdf and image/png).
Returns the raw model JSON response for the next state (StoreResult) to
persist.
"""
import os

from bedrock_helper import (
    invoke_model,
    invoke_model_with_file,
    render_file_mode_prompt,
    render_prompt,
)

PROMPT_TEXT = os.environ["PROMPT_TEXT"]


def lambda_handler(event, context):
    # event is the Step Functions execution input directly (the API
    # Gateway integration maps $request.body straight into it) - not an
    # API-Gateway-proxy-style {"body": "<json string>"} envelope. A live
    # test caught this: event.get("body") was always None, silently
    # producing an empty prompt.
    document_base64 = event.get("document_base64")
    media_type = event.get("media_type")

    if document_base64 and media_type:
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
    }
