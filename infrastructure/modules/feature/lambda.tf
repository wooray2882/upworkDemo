# Feature-specific Lambda(s). References the shared Bedrock-helper layer and
# exec role from the core engine — only the prompt and expected response
# shape differ between features.

data "archive_file" "ai_call" {
  type        = "zip"
  source_dir  = "${var.lambda_source_dir}/ai-call"
  output_path = "${path.module}/../../../.build/${var.feature_name}-ai-call.zip"
}

resource "aws_lambda_function" "ai_call" {
  function_name    = "${var.feature_name}-ai-call-${var.environment}"
  filename         = data.archive_file.ai_call.output_path
  source_code_hash = data.archive_file.ai_call.output_base64sha256
  handler          = "handler.lambda_handler"
  runtime          = "python3.12"
  role             = var.lambda_exec_role_arn
  timeout          = 30
  layers           = [var.bedrock_helper_layer_arn]

  environment {
    variables = {
      PROMPT_PATH  = var.prompt_path
      TABLE_NAME   = aws_dynamodb_table.this.name
      FEATURE_NAME = var.feature_name
    }
  }

  tags = merge(var.tags, { Feature = var.feature_name })
}

resource "aws_cloudwatch_log_group" "ai_call" {
  name              = "/aws/lambda/${aws_lambda_function.ai_call.function_name}"
  retention_in_days = var.log_retention_days
  tags              = var.tags
}

resource "aws_lambda_function" "postprocess" {
  count = var.has_postprocess_lambda ? 1 : 0

  function_name    = "${var.feature_name}-postprocess-${var.environment}"
  filename         = data.archive_file.postprocess[0].output_path
  source_code_hash = data.archive_file.postprocess[0].output_base64sha256
  handler          = "handler.lambda_handler"
  runtime          = "python3.12"
  role             = var.lambda_exec_role_arn
  timeout          = 30

  environment {
    variables = {
      TABLE_NAME   = aws_dynamodb_table.this.name
      FEATURE_NAME = var.feature_name
    }
  }

  tags = merge(var.tags, { Feature = var.feature_name })
}

data "archive_file" "postprocess" {
  count = var.has_postprocess_lambda ? 1 : 0

  type        = "zip"
  source_dir  = "${var.lambda_source_dir}/postprocess"
  output_path = "${path.module}/../../../.build/${var.feature_name}-postprocess.zip"
}
