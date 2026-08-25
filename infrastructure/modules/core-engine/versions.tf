terraform {
  required_version = ">= 1.7"

  required_providers {
    aws = {
      source = "hashicorp/aws"
      # aws_s3vectors_* resources landed in 6.24.0; storage_configuration.
      # s3_vectors_configuration on aws_bedrockagent_knowledge_base landed
      # in 6.27.0 (confirmed against provider release notes).
      version = ">= 6.27, < 7.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
}
