"""AI-call Lambda for the bookkeeping-query feature.

Extracts structured transaction records from a raw batch of receipts/
transactions via the shared Bedrock helper layer. This is the ingestion
side of the feature — the conversational "ask questions about my spend"
side is served separately by querying the shared RAG knowledge base
(see docs/architecture.md, "Validating the design: bookkeeping/revenue
tracker").
"""
import os

from bedrock_helper import invoke_model, render_prompt

PROMPT_TEXT = os.environ["PROMPT_TEXT"]


def lambda_handler(event, context):
    # event is the Step Functions execution input directly, not an
    # API-Gateway-proxy-style {"body": "<json string>"} envelope.
    transactions_text = event.get("transactions_text", "")

    prompt = render_prompt(PROMPT_TEXT, transactions_text=transactions_text)
    result = invoke_model(prompt)

    return {
        "raw_input_summary": f"{result.get('transaction_count', '?')} transactions extracted",
        "structured_result": result,
    }
