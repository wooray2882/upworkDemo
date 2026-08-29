"""RAG chat query Lambda: POST /rag-query.

Invoked directly by API Gateway (AWS_PROXY, not Step Functions). Queries
the real Bedrock Knowledge Base (S3 Vectors-backed, see
modules/core-engine/rag-knowledge-base.tf) via RetrieveAndGenerate - real
vector similarity search over whatever has actually been ingested into the
index, then a grounded Bedrock answer citing the retrieved chunks.

Two things this used to get wrong, both caught live from real testing:
  - No filtering: every app's chat searched the ENTIRE knowledge base (all
    three features' records mixed together), so Document Extractor's
    assistant could surface bookkeeping/review content and vice versa.
    `context` (sent by the frontend as "bookkeeping"/"document"/"reviews",
    see RAGChat.init) is now mapped to the same feature_type value each
    postprocess Lambda tags its RAG summary with, and passed as a metadata
    filter so retrieval only searches that app's own records.
  - Default response style: RetrieveAndGenerate's built-in prompt produces
    a dense, numbered, semi-structured dump - not the plain conversational
    answer a demo chat should read like. A custom prompt template fixes
    the tone without touching retrieval behavior.
"""
import json
import os

import boto3

KNOWLEDGE_BASE_ID = os.environ["KNOWLEDGE_BASE_ID"]
MODEL_ARN = os.environ["MODEL_ARN"]

client = boto3.client("bedrock-agent-runtime")

# Must match the FEATURE_NAME each feature's Terraform module block uses
# (see infrastructure/environments/demo/main.tf) - that's the exact string
# each postprocess Lambda tags its RAG summary's feature_type metadata
# with (see bedrock_helper.index_for_rag callers).
CONTEXT_TO_FEATURE_TYPE = {
    "bookkeeping": "bookkeeping-query",
    "document": "extract-document",
    "reviews": "analyze-reviews",
}

PROMPT_TEMPLATE = """You are a friendly, knowledgeable assistant helping someone understand their own data. Answer in plain, natural, conversational language - like a helpful colleague, not a report generator. Keep it to a few sentences unless the user specifically asks for a full list or breakdown; never dump every field of every record. Use only information from the search results below; if nothing relevant turns up, say so plainly instead of guessing.

Search results:
$search_results$

$output_format_instructions$"""


def lambda_handler(event, context):
    body = json.loads(event.get("body") or "{}")
    question = body.get("question", "").strip()
    view_context = body.get("context", "")

    headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
    }

    if not question:
        return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "question is required"})}

    knowledge_base_config = {
        "knowledgeBaseId": KNOWLEDGE_BASE_ID,
        "modelArn": MODEL_ARN,
        "generationConfiguration": {
            "promptTemplate": {"textPromptTemplate": PROMPT_TEMPLATE}
        },
    }

    feature_type = CONTEXT_TO_FEATURE_TYPE.get(view_context)
    if feature_type:
        knowledge_base_config["retrievalConfiguration"] = {
            "vectorSearchConfiguration": {
                "filter": {"equals": {"key": "feature_type", "value": feature_type}}
            }
        }

    response = client.retrieve_and_generate(
        input={"text": question},
        retrieveAndGenerateConfiguration={
            "type": "KNOWLEDGE_BASE",
            "knowledgeBaseConfiguration": knowledge_base_config,
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
