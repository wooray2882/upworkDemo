"""Post-process Lambda for the extract-document feature.

Persists the AI-call result to this feature's DynamoDB table using the
shared generic schema, and (in a full implementation) writes a copy to the
RAG knowledge base's S3 data source for conversational follow-up.
"""
import os
import uuid
from datetime import datetime, timezone

import boto3
from bedrock_helper import to_dynamodb_safe

TABLE_NAME = os.environ["TABLE_NAME"]
FEATURE_NAME = os.environ["FEATURE_NAME"]

table = boto3.resource("dynamodb").Table(TABLE_NAME)


def lambda_handler(event, context):
    item = {
        "id": str(uuid.uuid4()),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "raw_input_summary": event.get("raw_input_summary", ""),
        "structured_result": to_dynamodb_safe(event.get("structured_result", {})),
        "feature_type": FEATURE_NAME,
    }
    s3_key = event.get("s3_key")
    if s3_key:
        item["s3_key"] = s3_key
    table.put_item(Item=item)
    return item
