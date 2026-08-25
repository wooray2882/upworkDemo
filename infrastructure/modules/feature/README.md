# feature module

Parameterized module instantiated once per demo/feature. Provisions one
DynamoDB table, one AI-call Lambda (+ optional post-process Lambda), one
Step Functions state machine, and one API Gateway route on the shared API.

## Usage

```hcl
module "review_analyzer" {
  source = "../../modules/feature"

  feature_name      = "analyze-reviews"
  prompt_path       = "../../../prompts/review-analyzer.txt"
  lambda_source_dir = "../../../lambdas/analyze-reviews"
  environment       = "demo"
  tags              = local.common_tags

  api_id                        = module.core_engine.api_id
  api_execution_arn             = module.core_engine.api_execution_arn
  lambda_exec_role_arn          = module.core_engine.lambda_exec_role_arn
  bedrock_helper_layer_arn      = module.core_engine.bedrock_helper_layer_arn
  step_functions_exec_role_arn  = module.core_engine.step_functions_exec_role_arn
}
```

`lambda_source_dir` must contain an `ai-call/` subdirectory with a
`handler.py` exposing `lambda_handler`. If `has_postprocess_lambda = true`,
it must also contain a `postprocess/` subdirectory in the same shape.

## Inputs / Outputs

See [`variables.tf`](./variables.tf) and [`outputs.tf`](./outputs.tf).

## Adding a new feature

See [`docs/adding-a-feature.md`](../../../docs/adding-a-feature.md) in the repo root.
