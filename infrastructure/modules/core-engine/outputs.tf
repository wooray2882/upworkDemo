output "api_id" {
  description = "ID of the shared API Gateway (HTTP API). Feature modules attach routes to this."
  value       = aws_apigatewayv2_api.core.id
}

output "api_execution_arn" {
  description = "Execution ARN of the shared API Gateway, used for Lambda permissions."
  value       = aws_apigatewayv2_api.core.execution_arn
}

output "api_endpoint" {
  description = "Invoke URL of the $default stage."
  value       = aws_apigatewayv2_stage.default.invoke_url
}

output "lambda_exec_role_arn" {
  description = "IAM role ARN feature Lambdas should assume."
  value       = aws_iam_role.lambda_exec.arn
}

output "bedrock_helper_layer_arn" {
  description = "ARN of the shared Bedrock-call helper Lambda layer."
  value       = aws_lambda_layer_version.bedrock_helper.arn
}

output "step_functions_exec_role_arn" {
  description = "IAM role ARN feature state machines should assume."
  value       = aws_iam_role.step_functions_exec.arn
}

output "rag_data_bucket" {
  description = "S3 bucket holding the source documents ingested by the RAG knowledge base."
  value       = aws_s3_bucket.rag_data.bucket
}

output "rag_knowledge_base_id" {
  description = "ID of the shared Bedrock Knowledge Base. Feature post-process Lambdas can trigger ingestion jobs against this."
  value       = aws_bedrockagent_knowledge_base.rag.id
}

output "rag_vector_bucket_arn" {
  description = "ARN of the S3 Vectors bucket backing the knowledge base (not OpenSearch)."
  value       = aws_s3vectors_bucket.rag.vector_bucket_arn
}
