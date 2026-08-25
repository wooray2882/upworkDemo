"""AI-call Lambda for the extract-document feature.

Reads the prompt template named by PROMPT_PATH, fills in the request input,
and calls Bedrock via the shared bedrock_helper layer. Returns the raw model
JSON response for the next state (StoreResult) to persist.
"""
import json
import os

from bedrock_helper import invoke_model, load_prompt

PROMPT_PATH = os.environ["PROMPT_PATH"]


def lambda_handler(event, context):
    body = json.loads(event.get("body") or "{}")
    document_text = body.get("document_text", "")

    prompt = load_prompt(PROMPT_PATH, document_text=document_text)
    result = invoke_model(prompt)

    return {
        "raw_input_summary": document_text[:200],
        "structured_result": result,
    }
