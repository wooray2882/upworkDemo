# Shared Bedrock Knowledge Base + S3 data source. Feature results are written
# here so the frontend can support conversational follow-up questions instead
# of one-shot structured output only.
#
# Demo-scoped on purpose: S3 vector store, not OpenSearch Serverless, to avoid
# standing infrastructure cost while proving the pattern (see docs/architecture.md).

resource "aws_s3_bucket" "rag_data" {
  bucket = "${var.project_name}-${var.environment}-rag-data"
  tags   = var.tags
}

resource "aws_s3_bucket_versioning" "rag_data" {
  bucket = aws_s3_bucket.rag_data.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_iam_role" "bedrock_kb_role" {
  name = "${var.project_name}-${var.environment}-bedrock-kb"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "bedrock.amazonaws.com" }
    }]
  })

  tags = var.tags
}

resource "aws_iam_role_policy" "bedrock_kb_s3_access" {
  name = "${var.project_name}-bedrock-kb-s3"
  role = aws_iam_role.bedrock_kb_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:GetObject", "s3:ListBucket"]
      Resource = [aws_s3_bucket.rag_data.arn, "${aws_s3_bucket.rag_data.arn}/*"]
    }]
  })
}

# NOTE: aws_bedrockagent_knowledge_base requires a vector store (this demo
# uses S3 Vectors / OpenSearch Serverless depending on provider version
# support at implementation time). Left as a documented next step rather than
# hardcoding a specific vector backend here — see docs/architecture.md.
