# Generic per-feature table. Every feature uses the same shape so the
# post-process Lambda pattern and the RAG ingestion path stay identical
# across features.

resource "aws_dynamodb_table" "this" {
  name         = "${var.feature_name}-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  point_in_time_recovery {
    enabled = false # demo scope; enable for production use
  }

  tags = merge(var.tags, { Feature = var.feature_name })
}

# Table schema (enforced at the application layer, not by DynamoDB):
#   id                  (S)  - partition key, UUID
#   created_at          (S)  - ISO-8601 timestamp
#   raw_input_summary   (S)  - short description of the input for display
#   structured_result   (M)  - JSON result from the AI call
#   feature_type        (S)  - this feature's name, for cross-feature queries
