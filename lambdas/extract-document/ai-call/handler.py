"""AI-call Lambda for the extract-document feature.

Fills the prompt template (baked in via the PROMPT_TEXT env var, see
modules/feature/lambda.tf) with the request input, and calls Bedrock via
the shared bedrock_helper layer. Returns the raw model JSON response for
the next state (StoreResult) to persist.
"""
import json
import os

from bedrock_helper import invoke_model, render_prompt

PROMPT_TEXT = os.environ["PROMPT_TEXT"]


def lambda_handler(event, context):
    body = json.loads(event.get("body") or "{}")
    document_text = body.get("document_text", "")

    prompt = render_prompt(PROMPT_TEXT, document_text=document_text)
    result = invoke_model(prompt)

    return {
        "raw_input_summary": document_text[:200],
        "structured_result": result,
    }
