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

variable "embedding_model_id" {
  description = "Bedrock embedding model ID used to populate the S3 Vectors index behind the RAG knowledge base."
  type        = string
  default     = "amazon.titan-embed-text-v2:0"
}

variable "embedding_dimension" {
  description = "Vector dimension for the S3 Vectors index. Must match the embedding model's output dimension (amazon.titan-embed-text-v2:0 defaults to 1024)."
  type        = number
  default     = 1024
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
