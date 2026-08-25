terraform {
  required_version = ">= 1.7"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 6.27, < 7.0" # matches modules/core-engine; see its versions.tf for why
    }
  }

  # Uncomment once a state bucket exists; local state is fine for initial
  # demo bring-up (see docs/architecture.md, "State management").
  # backend "s3" {
  #   bucket = "upwork-demo-tfstate"
  #   key    = "demo/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}

locals {
  common_tags = {
    Project     = "upwork-demo-platform"
    Environment = "demo"
    ManagedBy   = "terraform"
  }
}

module "core_engine" {
  source = "../../modules/core-engine"

  project_name = "upwork-demo"
  environment  = "demo"
  tags         = local.common_tags
}

# --- Feature instances -------------------------------------------------
# Each new demo is one more block here. See docs/adding-a-feature.md.

module "document_extractor" {
  source = "../../modules/feature"

  feature_name           = "extract-document"
  prompt_path            = "../../../prompts/document-extractor.txt"
  lambda_source_dir      = "../../../lambdas/extract-document"
  has_postprocess_lambda = true
  environment            = "demo"
  tags                   = local.common_tags

  api_id                       = module.core_engine.api_id
  api_execution_arn            = module.core_engine.api_execution_arn
  lambda_exec_role_arn         = module.core_engine.lambda_exec_role_arn
  bedrock_helper_layer_arn     = module.core_engine.bedrock_helper_layer_arn
  step_functions_exec_role_arn = module.core_engine.step_functions_exec_role_arn
}

# module "review_analyzer" {
#   source              = "../../modules/feature"
#   feature_name        = "analyze-reviews"
#   prompt_path         = "../../../prompts/review-analyzer.txt"
#   lambda_source_dir   = "../../../lambdas/analyze-reviews"
#   environment         = "demo"
#   tags                = local.common_tags
#   api_id                       = module.core_engine.api_id
#   api_execution_arn            = module.core_engine.api_execution_arn
#   lambda_exec_role_arn         = module.core_engine.lambda_exec_role_arn
#   bedrock_helper_layer_arn     = module.core_engine.bedrock_helper_layer_arn
#   step_functions_exec_role_arn = module.core_engine.step_functions_exec_role_arn
# }

# module "bookkeeping_tracker" {
#   source              = "../../modules/feature"
#   feature_name        = "bookkeeping-query"
#   prompt_path         = "../../../prompts/bookkeeping.txt"
#   lambda_source_dir   = "../../../lambdas/bookkeeping-query"
#   has_postprocess_lambda = true
#   environment         = "demo"
#   tags                = local.common_tags
#   api_id                       = module.core_engine.api_id
#   api_execution_arn            = module.core_engine.api_execution_arn
#   lambda_exec_role_arn         = module.core_engine.lambda_exec_role_arn
#   bedrock_helper_layer_arn     = module.core_engine.bedrock_helper_layer_arn
#   step_functions_exec_role_arn = module.core_engine.step_functions_exec_role_arn
# }
