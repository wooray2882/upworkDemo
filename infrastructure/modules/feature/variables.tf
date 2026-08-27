variable "feature_name" {
  description = "URL-safe feature identifier, e.g. \"extract-document\". Used as a prefix for all feature resources and as the API route segment."
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.feature_name))
    error_message = "feature_name must be lowercase alphanumeric with hyphens only."
  }
}

variable "prompt_path" {
  description = "Path to the prompt template this feature's Lambda uses when calling Bedrock."
  type        = string
}

variable "lambda_source_dir" {
  description = "Path to this feature's Lambda source directory (AI-call handler, plus optional post-process handler)."
  type        = string
}

variable "has_postprocess_lambda" {
  description = "Whether this feature has a second Lambda for parsing/storing the AI result, in addition to the AI-call Lambda."
  type        = bool
  default     = false
}

variable "http_method" {
  description = "HTTP method for this feature's API route."
  type        = string
  default     = "POST"
}

variable "environment" {
  description = "Deployment environment (e.g. demo, staging, prod)."
  type        = string
  default     = "demo"
}

variable "log_retention_days" {
  description = "CloudWatch log retention (days) for this feature's Lambdas."
  type        = number
  default     = 14
}

variable "tags" {
  description = "Common tags applied to this feature's resources."
  type        = map(string)
  default     = {}
}

# Wiring into the core engine — pass `module.core_engine` outputs from the
# calling environment (see infrastructure/environments/demo/main.tf).
variable "api_id" {
  description = "Shared API Gateway ID from the core-engine module."
  type        = string
}

variable "api_execution_arn" {
  description = "Shared API Gateway execution ARN from the core-engine module."
  type        = string
}

variable "lambda_exec_role_arn" {
  description = "Shared Lambda execution role ARN from the core-engine module."
  type        = string
}

variable "lambda_exec_role_name" {
  description = "Shared Lambda execution role NAME from the core-engine module - used to attach this feature's table-scoped DynamoDB policy to the shared role."
  type        = string
}

variable "bedrock_helper_layer_arn" {
  description = "Shared Bedrock helper Lambda layer ARN from the core-engine module."
  type        = string
}

variable "step_functions_exec_role_arn" {
  description = "Shared Step Functions execution role ARN from the core-engine module."
  type        = string
}

variable "uploads_bucket" {
  description = "Shared presigned-upload S3 bucket name from the core-engine module. Only features whose ai-call Lambda reads uploaded files (s3_key input) need this - pass \"\" for features that don't."
  type        = string
  default     = ""
}
