"""Clear Lambda for the extract-document feature.

Invoked directly by API Gateway (AWS_PROXY, not via Step Functions) on
DELETE /extract-document. Deletes every item in this feature's DynamoDB
table - a deliberate "reset to fresh demo data" action for testing, not
part of the normal application flow. Irreversible; the frontend confirms
with the user before calling this (see components/modal.js usage in
views/bookkeeping.js).
"""
import json
import os

import boto3

TABLE_NAME = os.environ["TABLE_NAME"]

table = boto3.resource("dynamodb").Table(TABLE_NAME)


def lambda_handler(event, context):
    response = table.scan(ProjectionExpression="id")
    items = response.get("Items", [])
    while "LastEvaluatedKey" in response:
        response = table.scan(ProjectionExpression="id", ExclusiveStartKey=response["LastEvaluatedKey"])
        items.extend(response.get("Items", []))

    with table.batch_writer() as batch:
        for item in items:
            batch.delete_item(Key={"id": item["id"]})

    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps({"deleted_count": len(items)}),
    }
