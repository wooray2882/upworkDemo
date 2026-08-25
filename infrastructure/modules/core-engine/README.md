# core-engine module

Provisions the shared platform infrastructure once. This module is instantiated
a single time per environment (see `infrastructure/environments/demo/main.tf`)
and every `feature` module attaches to its outputs.

## Resources

| File | Provisions |
|---|---|
| `api-gateway.tf` | Shared HTTP API Gateway + `$default` stage + access logs |
| `lambda-shared-layer.tf` | Bedrock-call helper Lambda layer, shared Lambda exec IAM role |
| `step-functions-template.tf` | Shared Step Functions exec IAM role |
| `rag-knowledge-base.tf` | S3 bucket + IAM role backing the shared Bedrock Knowledge Base |

## Inputs

See [`variables.tf`](./variables.tf).

## Outputs

See [`outputs.tf`](./outputs.tf). Feature modules consume `api_id`,
`api_execution_arn`, `lambda_exec_role_arn`, `bedrock_helper_layer_arn`, and
`step_functions_exec_role_arn`.

## Notes

- The Bedrock Knowledge Base vector store backend is intentionally left as a
  follow-up (see the `NOTE` in `rag-knowledge-base.tf`) — provider support for
  `aws_bedrockagent_knowledge_base` should be confirmed against the AWS
  provider version pinned in `versions.tf` before implementing it.
- This module should change rarely. If a change here only benefits one
  feature, it probably belongs in the `feature` module instead.
