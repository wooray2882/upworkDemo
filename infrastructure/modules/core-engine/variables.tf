variable "project_name" {
  description = "Short name used as a prefix for all core-engine resources."
  type        = string
  default     = "upwork-demo"
}

variable "environment" {
  description = "Deployment environment (e.g. demo, staging, prod)."
  type        = string
  default     = "demo"
}

variable "bedrock_model_id" {
  description = "Bedrock model ID used by the shared AI-call Lambda layer."
  type        = string
  default     = "anthropic.claude-3-haiku-20240307-v1:0"
}

variable "log_retention_days" {
  description = "CloudWatch log retention (days) for core-engine resources."
  type        = number
  default     = 14
}

variable "tags" {
  description = "Common tags applied to all core-engine resources."
  type        = map(string)
  default     = {}
}
