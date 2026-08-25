# Shared Lambda layer: common Bedrock-call helper (auth, retries, JSON-response
# validation). Every feature Lambda attaches this layer instead of re-implementing
# the Bedrock client.

data "archive_file" "shared_layer" {
  type        = "zip"
  source_dir  = "${path.module}/../../../lambda-layers/bedrock-helper"
  output_path = "${path.module}/../../../.build/bedrock-helper-layer.zip"
}

resource "aws_lambda_layer_version" "bedrock_helper" {
  layer_name          = "${var.project_name}-bedrock-helper"
  filename            = data.archive_file.shared_layer.output_path
  source_code_hash    = data.archive_file.shared_layer.output_base64sha256
  compatible_runtimes = ["python3.12"]
}

# IAM role shared by all feature Lambdas. Scoped to Bedrock invoke + the
# feature's own DynamoDB table (attached per-feature, see modules/feature).
resource "aws_iam_role" "lambda_exec" {
  name = "${var.project_name}-${var.environment}-lambda-exec"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "lambda_basic_exec" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "bedrock_invoke" {
  name = "${var.project_name}-bedrock-invoke"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"]
      Resource = "*"
    }]
  })
}
