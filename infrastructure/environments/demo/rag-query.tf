# RAG chat query: POST /rag-query. Lives in the environment (not a shared
# module) because it's cross-feature by nature - it needs every feature's
# table name, and core-engine deliberately doesn't know about individual
# features (see docs/adding-a-feature.md). Reuses the shared Lambda exec
# role: it already has dynamodb:Scan on all three tables (each feature
# module attaches its own table-scoped policy to that same shared role,
# see modules/feature/dynamodb-table.tf) and bedrock:InvokeModel, so no new
# IAM is needed here.

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
  layers           = [module.core_engine.bedrock_helper_layer_arn]

  environment {
    variables = {
      TABLE_DOCUMENTS   = module.document_extractor.table_name
      TABLE_REVIEWS     = module.review_analyzer.table_name
      TABLE_BOOKKEEPING = module.bookkeeping_tracker.table_name
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
