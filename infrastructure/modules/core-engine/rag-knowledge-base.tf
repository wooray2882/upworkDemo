# Shared Bedrock Knowledge Base + RAG data store. Feature results are written
# to S3, ingested by the knowledge base, and embedded into an S3 Vectors
# index so the frontend can support conversational follow-up questions
# instead of one-shot structured output only.
#
# Vector store: S3 Vectors (native S3 vector buckets/indexes), NOT OpenSearch
# Serverless. OpenSearch Serverless is explicitly excluded from this platform
# — it carries a standing per-hour OCU cost even at rest, which doesn't fit a
# demo-scoped, mostly-idle portfolio platform. S3 Vectors has no standing
# compute cost; you pay for storage and queries only. See docs/architecture.md.

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

# --- S3 Vectors: the vector store backing the knowledge base ---------------
# Resource names/attributes per hashicorp/aws provider docs:
#   https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/s3vectors_vector_bucket
#   https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/s3vectors_index

resource "aws_s3vectors_vector_bucket" "rag" {
  vector_bucket_name = "${var.project_name}-${var.environment}-rag-vectors"
}

resource "aws_s3vectors_index" "rag" {
  vector_bucket_name = aws_s3vectors_vector_bucket.rag.vector_bucket_name
  index_name         = "${var.project_name}-${var.environment}-rag-index"
  data_type          = "float32"
  dimension          = var.embedding_dimension
  distance_metric    = "cosine"
}

# --- IAM: role Bedrock assumes to read source docs and write/query vectors -

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

resource "aws_iam_role_policy" "bedrock_kb_s3vectors_access" {
  name = "${var.project_name}-bedrock-kb-s3vectors"
  role = aws_iam_role.bedrock_kb_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3vectors:PutVectors",
        "s3vectors:GetVectors",
        "s3vectors:QueryVectors",
        "s3vectors:DeleteVectors",
        "s3vectors:GetIndex",
        "s3vectors:GetVectorBucket",
      ]
      Resource = [
        aws_s3vectors_vector_bucket.rag.vector_bucket_arn,
        aws_s3vectors_index.rag.index_arn,
      ]
    }]
  })
}

resource "aws_iam_role_policy" "bedrock_kb_embed_model" {
  name = "${var.project_name}-bedrock-kb-embed-model"
  role = aws_iam_role.bedrock_kb_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "bedrock:InvokeModel"
      Resource = "arn:aws:bedrock:*::foundation-model/${var.embedding_model_id}"
    }]
  })
}

# --- Bedrock Knowledge Base --------------------------------------------

resource "aws_bedrockagent_knowledge_base" "rag" {
  name     = "${var.project_name}-${var.environment}-rag"
  role_arn = aws_iam_role.bedrock_kb_role.arn

  knowledge_base_configuration {
    type = "VECTOR"
    vector_knowledge_base_configuration {
      embedding_model_arn = "arn:aws:bedrock:*::foundation-model/${var.embedding_model_id}"
    }
  }

  storage_configuration {
    type = "S3_VECTORS"
    s3_vectors_configuration {
      # index_arn alone is sufficient and conflicts with index_name/vector_bucket_arn.
      index_arn = aws_s3vectors_index.rag.index_arn
    }
  }

  tags = var.tags
}

resource "aws_bedrockagent_data_source" "rag" {
  knowledge_base_id = aws_bedrockagent_knowledge_base.rag.id
  name              = "${var.project_name}-${var.environment}-rag-source"

  data_source_configuration {
    type = "S3"
    s3_configuration {
      bucket_arn = aws_s3_bucket.rag_data.arn
    }
  }
}
