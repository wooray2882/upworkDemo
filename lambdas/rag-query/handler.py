"""RAG chat query Lambda: POST /rag-query.

Invoked directly by API Gateway (AWS_PROXY, not Step Functions). Queries
the real Bedrock Knowledge Base (S3 Vectors-backed, see
modules/core-engine/rag-knowledge-base.tf) via RetrieveAndGenerate - real
vector similarity search over whatever has actually been ingested into the
index, then a grounded Bedrock answer citing the retrieved chunks.

Earlier version of this Lambda scanned DynamoDB directly instead, because
the Knowledge Base's S3 data source had never been populated/synced (see
docs/CHANGELOG.md). That gap is closed - the index now holds real ingested
content - so this uses the real Knowledge Base as originally designed.
"""
import json
import os

import boto3

KNOWLEDGE_BASE_ID = os.environ["KNOWLEDGE_BASE_ID"]
MODEL_ARN = os.environ["MODEL_ARN"]

client = boto3.client("bedrock-agent-runtime")


def lambda_handler(event, context):
    body = json.loads(event.get("body") or "{}")
    question = body.get("question", "").strip()

    headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
    }

    if not question:
        return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "question is required"})}

    response = client.retrieve_and_generate(
        input={"text": question},
        retrieveAndGenerateConfiguration={
            "type": "KNOWLEDGE_BASE",
            "knowledgeBaseConfiguration": {
                "knowledgeBaseId": KNOWLEDGE_BASE_ID,
                "modelArn": MODEL_ARN,
            },
        },
    )

    citations = []
    for citation in response.get("citations", []):
        for ref in citation.get("retrievedReferences", []):
            uri = ref.get("location", {}).get("s3Location", {}).get("uri", "")
            if uri and uri not in citations:
                citations.append(uri)

    return {
        "statusCode": 200,
        "headers": headers,
        "body": json.dumps({
            "answer": response["output"]["text"],
            "citations": citations,
        }),
    }
