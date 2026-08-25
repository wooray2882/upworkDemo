# Adds this feature's route to the shared API Gateway. All routes sit behind
# the same gateway/deployment pattern (see modules/core-engine/api-gateway.tf).

resource "aws_iam_role" "api_invoke_sfn" {
  name = "${var.feature_name}-api-invoke-sfn-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "apigateway.amazonaws.com" }
    }]
  })

  tags = var.tags
}

resource "aws_iam_role_policy" "api_invoke_sfn" {
  name = "${var.feature_name}-api-invoke-sfn"
  role = aws_iam_role.api_invoke_sfn.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "states:StartSyncExecution"
      Resource = aws_sfn_state_machine.this.arn
    }]
  })
}

resource "aws_apigatewayv2_integration" "this" {
  api_id                 = var.api_id
  integration_type       = "AWS_PROXY"
  integration_subtype    = "StepFunctions-StartSyncExecution"
  credentials_arn        = aws_iam_role.api_invoke_sfn.arn
  payload_format_version = "1.0"

  request_parameters = {
    StateMachineArn = aws_sfn_state_machine.this.arn
    Input           = "$request.body"
  }
}

resource "aws_apigatewayv2_route" "this" {
  api_id    = var.api_id
  route_key = "${var.http_method} /${var.feature_name}"
  target    = "integrations/${aws_apigatewayv2_integration.this.id}"
}
