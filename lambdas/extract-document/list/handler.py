"""List Lambda for the extract-document feature.

Invoked directly by API Gateway (AWS_PROXY, not via Step Functions - a
plain read doesn't need orchestration) on GET /extract-document. Scans
the feature's DynamoDB table and returns records newest-first.
"""
import json
import os
from decimal import Decimal

import boto3

TABLE_NAME = os.environ["TABLE_NAME"]

table = boto3.resource("dynamodb").Table(TABLE_NAME)


def _json_default(value):
    if isinstance(value, Decimal):
        return float(value) if value % 1 else int(value)
    raise TypeError(f"Object of type {type(value)} is not JSON serializable")


def lambda_handler(event, context):
    response = table.scan()
    items = sorted(response.get("Items", []), key=lambda i: i.get("created_at", ""), reverse=True)

    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-store",
        },
        "body": json.dumps(items, default=_json_default),
    }
