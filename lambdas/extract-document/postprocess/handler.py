"""Post-process Lambda for the extract-document feature.

Persists the AI-call result to this feature's DynamoDB table using the
shared generic schema, and writes a plain-text summary to the RAG knowledge
base's S3 data source (then triggers a re-index) so conversational
follow-ups reflect this document immediately, not just whatever was
ingested at some earlier point.
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
    """Plain-English summary of an extracted document - what a
    conversational chat query should actually be able to answer from, not a
    JSON dump of every extracted field."""
    doc_type = structured_result.get("document_type") or "Document"
    summary = structured_result.get("summary") or ""
    lines = [f"{doc_type} extraction."]
    if summary:
        lines.append(summary)
    for key, value in structured_result.items():
        if key in ("document_type", "summary") or isinstance(value, (dict, list)):
            continue
        lines.append(f"{key.replace('_', ' ').title()}: {value}")
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
    s3_key = event.get("s3_key")
    if s3_key:
        item["s3_key"] = s3_key
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
