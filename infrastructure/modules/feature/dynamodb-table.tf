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

# The shared Lambda exec role (core-engine) has no DynamoDB permissions of
# its own - core-engine can't know feature table names ahead of time. Each
# feature attaches its own table-scoped policy to that shared role instead.
# A live test caught the exec role having no dynamodb:PutItem permission at
# all before this was added.
resource "aws_iam_role_policy" "dynamodb_access" {
  name = "${var.feature_name}-dynamodb-access"
  role = var.lambda_exec_role_name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["dynamodb:PutItem", "dynamodb:GetItem", "dynamodb:Query", "dynamodb:Scan"]
      Resource = aws_dynamodb_table.this.arn
    }]
  })
}

# Table schema (enforced at the application layer, not by DynamoDB):
#   id                  (S)  - partition key, UUID
#   created_at          (S)  - ISO-8601 timestamp
#   raw_input_summary   (S)  - short description of the input for display
#   structured_result   (M)  - JSON result from the AI call
#   feature_type        (S)  - this feature's name, for cross-feature queries
