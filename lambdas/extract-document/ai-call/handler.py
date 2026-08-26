"""AI-call Lambda for the extract-document feature.

Fills the prompt template (baked in via the PROMPT_TEXT env var, see
modules/feature/lambda.tf) with the request input, and calls Bedrock via
the shared bedrock_helper layer. Returns the raw model JSON response for
the next state (StoreResult) to persist.
"""
import os

from bedrock_helper import invoke_model, render_prompt

PROMPT_TEXT = os.environ["PROMPT_TEXT"]


def lambda_handler(event, context):
    # event is the Step Functions execution input directly (the API
    # Gateway integration maps $request.body straight into it) - not an
    # API-Gateway-proxy-style {"body": "<json string>"} envelope. A live
    # test caught this: event.get("body") was always None, silently
    # producing an empty prompt.
    document_text = event.get("document_text", "")

    prompt = render_prompt(PROMPT_TEXT, document_text=document_text)
    result = invoke_model(prompt)

    return {
        "raw_input_summary": document_text[:200],
        "structured_result": result,
    }
