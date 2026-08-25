terraform {
  required_version = ">= 1.7"

  required_providers {
    aws = {
      source = "hashicorp/aws"
      # >= 5.100 required for aws_s3vectors_* and the S3_VECTORS storage
      # type on aws_bedrockagent_knowledge_base.
      version = ">= 5.100, < 6.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
}
