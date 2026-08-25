output "route_path" {
  description = "Path this feature is reachable at on the shared API Gateway."
  value       = "/${var.feature_name}"
}

output "state_machine_arn" {
  description = "ARN of this feature's Step Functions state machine."
  value       = aws_sfn_state_machine.this.arn
}

output "table_name" {
  description = "Name of this feature's DynamoDB table."
  value       = aws_dynamodb_table.this.name
}

output "ai_call_lambda_arn" {
  description = "ARN of this feature's AI-call Lambda."
  value       = aws_lambda_function.ai_call.arn
}
