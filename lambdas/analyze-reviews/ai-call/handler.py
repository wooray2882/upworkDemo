"""AI-call Lambda for the analyze-reviews feature.

Reads a batch of customer reviews, calls Bedrock via the shared helper layer
using the review-analyzer prompt, and returns the structured sentiment/theme
result for the next state (StoreResult) to persist.
"""
import json
import os

from bedrock_helper import invoke_model, load_prompt

PROMPT_PATH = os.environ["PROMPT_PATH"]


def lambda_handler(event, context):
    body = json.loads(event.get("body") or "{}")
    reviews_text = body.get("reviews_text", "")

    prompt = load_prompt(PROMPT_PATH, reviews_text=reviews_text)
    result = invoke_model(prompt)

    return {
        "raw_input_summary": f"{result.get('review_count', '?')} reviews analyzed",
        "structured_result": result,
    }
