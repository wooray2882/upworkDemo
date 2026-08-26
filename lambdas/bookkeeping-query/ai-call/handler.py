"""AI-call Lambda for the bookkeeping-query feature.

Extracts structured transaction records from a raw batch of receipts/
transactions via the shared Bedrock helper layer. This is the ingestion
side of the feature — the conversational "ask questions about my spend"
side is served separately by querying the shared RAG knowledge base
(see docs/architecture.md, "Validating the design: bookkeeping/revenue
tracker").
"""
import json
import os

from bedrock_helper import invoke_model, load_prompt

PROMPT_PATH = os.environ["PROMPT_PATH"]


def lambda_handler(event, context):
    body = json.loads(event.get("body") or "{}")
    transactions_text = body.get("transactions_text", "")

    prompt = load_prompt(PROMPT_PATH, transactions_text=transactions_text)
    result = invoke_model(prompt)

    return {
        "raw_input_summary": f"{result.get('transaction_count', '?')} transactions extracted",
        "structured_result": result,
    }
