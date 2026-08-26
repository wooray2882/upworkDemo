# RAG chat query: POST /rag-query. Lives in the environment (not a shared
# module) because it references the specific knowledge base instance from
# core-engine. Reuses the shared Lambda exec role, which already has
# bedrock:Retrieve/RetrieveAndGenerate scoped to this knowledge base (see
# modules/core-engine/rag-knowledge-base.tf's bedrock_kb_query policy) - no
# new IAM needed here.
#
# modelArn must be the full inference-profile ARN (not a bare model id) -
# confirmed live: bedrock-agent-runtime's RetrieveAndGenerate rejected the
# plain "us.anthropic.claude-sonnet-4-6" id format that invoke_model()
# accepts elsewhere in this codebase.

data "aws_caller_identity" "current" {}

data "archive_file" "rag_query" {
  type        = "zip"
  source_dir  = "../../../lambdas/rag-query"
  output_path = "../../../.build/rag-query.zip"
}

resource "aws_lambda_function" "rag_query" {
  function_name    = "rag-query-demo"
  filename         = data.archive_file.rag_query.output_path
  source_code_hash = data.archive_file.rag_query.output_base64sha256
  handler          = "handler.lambda_handler"
  runtime          = "python3.12"
  role             = module.core_engine.lambda_exec_role_arn
  timeout          = 20

  environment {
    variables = {
      KNOWLEDGE_BASE_ID = module.core_engine.rag_knowledge_base_id
      MODEL_ARN         = "arn:aws:bedrock:${var.aws_region}:${data.aws_caller_identity.current.account_id}:inference-profile/us.anthropic.claude-sonnet-4-6"
    }
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "rag_query" {
  name              = "/aws/lambda/${aws_lambda_function.rag_query.function_name}"
  retention_in_days = 14
  tags              = local.common_tags
}

resource "aws_apigatewayv2_integration" "rag_query" {
  api_id                 = module.core_engine.api_id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.rag_query.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "rag_query" {
  api_id    = module.core_engine.api_id
  route_key = "POST /rag-query"
  target    = "integrations/${aws_apigatewayv2_integration.rag_query.id}"
}

resource "aws_lambda_permission" "rag_query_api_gateway" {
  statement_id  = "AllowAPIGatewayInvokeRagQuery"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.rag_query.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${module.core_engine.api_execution_arn}/*/*/rag-query"
}
