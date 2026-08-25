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
| `rag-knowledge-base.tf` | S3 data bucket, S3 Vectors bucket/index, IAM role, and the Bedrock Knowledge Base + data source |

## Inputs

See [`variables.tf`](./variables.tf).

## Outputs

See [`outputs.tf`](./outputs.tf). Feature modules consume `api_id`,
`api_execution_arn`, `lambda_exec_role_arn`, `bedrock_helper_layer_arn`, and
`step_functions_exec_role_arn`.

## Notes

- **Vector store: S3 Vectors, not OpenSearch Serverless.** OpenSearch
  Serverless is deliberately excluded from this platform — it bills a
  standing per-hour OCU cost even when idle, which doesn't fit a
  mostly-idle demo platform. S3 Vectors has no standing compute cost; you
  pay for storage and queries only. Requires AWS provider `>= 6.27`
  (pinned in `versions.tf` — `aws_s3vectors_*` resources landed in 6.24.0,
  `storage_configuration.s3_vectors_configuration` on
  `aws_bedrockagent_knowledge_base` landed in 6.27.0; confirmed against
  provider release notes, not guessed).
- This module should change rarely. If a change here only benefits one
  feature, it probably belongs in the `feature` module instead.
