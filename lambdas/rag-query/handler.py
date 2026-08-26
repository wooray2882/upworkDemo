"""RAG chat query Lambda: POST /rag-query.

Invoked directly by API Gateway (AWS_PROXY, not Step Functions). Scans the
relevant feature table(s) for real stored records, and asks Bedrock to
answer the user's question grounded in that real data.

This is a pragmatic RAG pattern (scan + stuff into context), not a formal
Bedrock Knowledge Base vector-search retrieval - the KB/S3-Vectors index
provisioned in modules/core-engine/rag-knowledge-base.tf exists but nothing
has ever been ingested into it, so wiring the chat to it would return empty
results. Scanning DynamoDB directly is real data and a working answer today;
switching to true KB retrieval is a documented follow-up (see
docs/architecture.md).
"""
import json
import os
from decimal import Decimal

import boto3
from bedrock_helper import invoke_model_text

TABLE_DOCUMENTS = os.environ["TABLE_DOCUMENTS"]
TABLE_REVIEWS = os.environ["TABLE_REVIEWS"]
TABLE_BOOKKEEPING = os.environ["TABLE_BOOKKEEPING"]

dynamodb = boto3.resource("dynamodb")

# Caps how many records get stuffed into the prompt, to keep latency and
# token cost bounded for this demo - not a production-scale RAG design.
MAX_RECORDS = 25


def _json_default(value):
    if isinstance(value, Decimal):
        return float(value) if value % 1 else int(value)
    raise TypeError(f"Object of type {type(value)} is not JSON serializable")


def _scan_table(table_name):
    table = dynamodb.Table(table_name)
    response = table.scan(Limit=MAX_RECORDS)
    return response.get("Items", [])


CONTEXT_TABLES = {
    "document": [TABLE_DOCUMENTS],
    "bookkeeping": [TABLE_BOOKKEEPING],
    "reviews": [TABLE_REVIEWS],
}


def lambda_handler(event, context):
    body = json.loads(event.get("body") or "{}")
    question = body.get("question", "").strip()
    view_context = body.get("context", "bookkeeping")

    headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
    }

    if not question:
        return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "question is required"})}

    table_names = CONTEXT_TABLES.get(view_context, [TABLE_BOOKKEEPING])
    records = []
    for name in table_names:
        records.extend(_scan_table(name))

    records_text = json.dumps(records, default=_json_default, indent=2) if records else "(no records stored yet)"

    prompt = f"""You are a data assistant answering questions about records stored in DynamoDB.
Answer ONLY using the data below - if the data doesn't contain the answer, say so honestly
rather than guessing. Be concise (2-4 sentences unless the question needs a list).

Stored records ({view_context}):
{records_text}

Question: {question}"""

    answer = invoke_model_text(prompt)

    return {
        "statusCode": 200,
        "headers": headers,
        "body": json.dumps({"answer": answer, "recordCount": len(records)}),
    }
