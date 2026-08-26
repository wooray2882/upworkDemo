"""Post-process Lambda for the analyze-reviews feature.

Persists the AI-call result to this feature's DynamoDB table using the
shared generic schema. In the full implementation this also writes a copy
to the RAG knowledge base's S3 data source so a user can ask conversational
follow-ups like "what did the angriest reviewer say".
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
    table.put_item(Item=item)
    return item
