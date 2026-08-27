"""Shared presigned-upload Lambda: POST /uploads/presign.

Every feature's upload modal calls this once per file before PUTting
straight to S3 - keeps large files off API Gateway/Lambda's payload limits
entirely. Returns a short-lived presigned PUT URL plus the S3 key the
frontend should reference in its follow-up POST to the feature's own route.
"""
import json
import os
import uuid

import boto3

UPLOADS_BUCKET = os.environ["UPLOADS_BUCKET"]
PRESIGN_EXPIRY_SECONDS = 300

s3 = boto3.client("s3")


def lambda_handler(event, context):
    body = json.loads(event.get("body") or "{}")
    file_name = body.get("file_name", "upload")
    content_type = body.get("content_type", "application/octet-stream")

    headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
    }

    if not file_name:
        return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "file_name is required"})}

    # Prefix with a uuid so concurrent uploads from different users (or a
    # batch from the same user) never collide on the same key.
    extension = file_name.rsplit(".", 1)[-1] if "." in file_name else "bin"
    s3_key = f"{uuid.uuid4()}.{extension}"

    upload_url = s3.generate_presigned_url(
        "put_object",
        Params={"Bucket": UPLOADS_BUCKET, "Key": s3_key, "ContentType": content_type},
        ExpiresIn=PRESIGN_EXPIRY_SECONDS,
    )

    return {
        "statusCode": 200,
        "headers": headers,
        "body": json.dumps({"upload_url": upload_url, "s3_key": s3_key}),
    }
