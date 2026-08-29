"""Post-process Lambda for the bookkeeping-query feature.

Persists the extracted transaction batch to this feature's DynamoDB table
using the shared generic schema, and writes a plain-text summary to the RAG
knowledge base's S3 data source (then triggers a re-index) so conversational
queries like "how much did I spend on software last month" reflect this
batch immediately, not just whatever was ingested at some earlier point.
"""
import os
import uuid
from datetime import datetime, timezone

import boto3
from bedrock_helper import index_for_rag, to_dynamodb_safe

TABLE_NAME = os.environ["TABLE_NAME"]
FEATURE_NAME = os.environ["FEATURE_NAME"]
RAG_DATA_BUCKET = os.environ.get("RAG_DATA_BUCKET", "")
RAG_KNOWLEDGE_BASE_ID = os.environ.get("RAG_KNOWLEDGE_BASE_ID", "")
RAG_DATA_SOURCE_ID = os.environ.get("RAG_DATA_SOURCE_ID", "")

table = boto3.resource("dynamodb").Table(TABLE_NAME)


def _rag_summary_text(structured_result: dict) -> str:
    """Plain-English summary of a transaction batch - what a conversational
    chat query should actually be able to answer from, not a JSON dump."""
    txns = structured_result.get("transactions") or []
    total = structured_result.get("total_amount")
    lines = [f"Expense batch with {len(txns)} transaction(s), total ${total}." if total is not None
             else f"Expense batch with {len(txns)} transaction(s)."]
    for t in txns:
        vendor = t.get("vendor") or "Unknown vendor"
        amount = t.get("amount")
        category = t.get("category") or "Other / Uncategorized"
        date = t.get("date") or "unknown date"
        lines.append(f"- {date}: {vendor}, ${amount}, category: {category}")
    return "\n".join(lines)


def lambda_handler(event, context):
    record_id = str(uuid.uuid4())
    structured_result = event.get("structured_result", {})
    item = {
        "id": record_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "raw_input_summary": event.get("raw_input_summary", ""),
        "structured_result": to_dynamodb_safe(structured_result),
        "feature_type": FEATURE_NAME,
    }
    table.put_item(Item=item)

    index_for_rag(
        bucket=RAG_DATA_BUCKET,
        key=f"{FEATURE_NAME}-{record_id}.txt",
        text=_rag_summary_text(structured_result),
        metadata={"feature_type": FEATURE_NAME},
        knowledge_base_id=RAG_KNOWLEDGE_BASE_ID,
        data_source_id=RAG_DATA_SOURCE_ID,
    )

    return item
