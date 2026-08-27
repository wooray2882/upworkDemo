# Shared file-upload capability: every feature that accepts a file upload
# (instead of pasted/typed text) uses the same presigned-URL bucket and
# Lambda, rather than each feature growing its own upload path. See
# docs/architecture.md "File ingestion" for why this lives in core-engine
# rather than per-feature, and why it does NOT use Amazon Textract.

resource "aws_s3_bucket" "uploads" {
  bucket = "${var.project_name}-${var.environment}-uploads"
  tags   = var.tags
}

# The frontend PUTs the file directly to S3 using the presigned URL - a
# real cross-origin browser request, so the bucket needs its own CORS
# config (separate from API Gateway's CORS, which only covers the API
# Gateway routes, not direct-to-S3 requests).
resource "aws_s3_bucket_cors_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  cors_rule {
    allowed_methods = ["PUT"]
    allowed_origins = ["*"]
    allowed_headers = ["content-type"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_public_access_block" "uploads" {
  bucket                  = aws_s3_bucket.uploads.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Uploaded files only need to survive the few seconds between the frontend's
# PUT and the ai-call Lambda reading them during the Step Functions
# execution that follows - not kept around, so storage cost stays ~$0
# regardless of demo traffic.
resource "aws_s3_bucket_lifecycle_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  rule {
    id     = "expire-uploads"
    status = "Enabled"
    filter {}
    expiration {
      days = 1
    }
  }
}

# --- Presign Lambda + shared route: POST /uploads/presign ------------------
# Shared (not per-feature) - every feature's upload modal calls this same
# endpoint before PUTting a file straight to S3.

data "archive_file" "upload_presign" {
  type        = "zip"
  source_dir  = "${path.module}/../../../lambdas/upload-presign"
  output_path = "${path.module}/../../../.build/upload-presign.zip"
}

resource "aws_lambda_function" "upload_presign" {
  function_name    = "${var.project_name}-upload-presign-${var.environment}"
  filename         = data.archive_file.upload_presign.output_path
  source_code_hash = data.archive_file.upload_presign.output_base64sha256
  handler          = "handler.lambda_handler"
  runtime          = "python3.12"
  role             = aws_iam_role.lambda_exec.arn
  timeout          = 10

  environment {
    variables = {
      UPLOADS_BUCKET = aws_s3_bucket.uploads.bucket
    }
  }

  tags = var.tags
}

resource "aws_cloudwatch_log_group" "upload_presign" {
  name              = "/aws/lambda/${aws_lambda_function.upload_presign.function_name}"
  retention_in_days = var.log_retention_days
  tags              = var.tags
}

resource "aws_apigatewayv2_integration" "upload_presign" {
  api_id                 = aws_apigatewayv2_api.core.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.upload_presign.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "upload_presign" {
  api_id    = aws_apigatewayv2_api.core.id
  route_key = "POST /uploads/presign"
  target    = "integrations/${aws_apigatewayv2_integration.upload_presign.id}"
}

resource "aws_lambda_permission" "upload_presign_api_gateway" {
  statement_id  = "AllowAPIGatewayInvokeUploadPresign"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.upload_presign.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.core.execution_arn}/*/*/uploads/presign"
}

# --- IAM: shared exec role gets read/write on the uploads bucket -----------
# Same pattern as the bedrock_invoke policy in lambda-shared-layer.tf -
# every feature Lambda (ai-call handlers) needs GetObject to read an
# uploaded file; the presign Lambda itself needs PutObject to sign PUT URLs.

resource "aws_iam_role_policy" "uploads_bucket_access" {
  name = "${var.project_name}-uploads-bucket-access"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:PutObject", "s3:GetObject"]
      Resource = "${aws_s3_bucket.uploads.arn}/*"
    }]
  })
}
