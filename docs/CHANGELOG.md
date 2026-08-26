# Changelog

All notable changes to this platform are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added (branch: `feature/analyze-reviews`)
- `analyze-reviews` feature: prompt template, AI-call and postprocess Lambda
  handlers, wired into `infrastructure/environments/demo/main.tf`.

### Fixed (branch: `core/fix-s3-vectors-resource-names`)
- `terraform validate` (blocked earlier by a full local disk, run once
  space was freed) caught invented resource/attribute names in the initial
  S3 Vectors implementation: `aws_s3vectors_bucket` (wrong — the real
  resource is `aws_s3vectors_vector_bucket`) and passing both
  `vector_bucket_arn` + `index_arn` into
  `storage_configuration.s3_vectors_configuration` (the block only accepts
  `index_arn` alone, or `index_name` + `vector_bucket_arn` — not all
  three). Corrected in `infrastructure/modules/core-engine/rag-knowledge-base.tf`.
- Bumped the AWS provider constraint from `>= 5.100, < 6.0` to
  `>= 6.27, < 7.0` across `core-engine`, `feature`, and the `demo`
  environment — verified against provider release notes:
  `aws_s3vectors_*` resources landed in 6.24.0,
  `storage_configuration.s3_vectors_configuration` support on
  `aws_bedrockagent_knowledge_base` landed in 6.27.0. AWS provider v6 was
  checked against the [v6 upgrade guide](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/guides/version-6-upgrade)
  for breaking changes affecting the other resources in this repo
  (S3, Lambda, DynamoDB, API Gateway v2, Step Functions, IAM) — none apply.

### Changed
- RAG vector store implemented as **S3 Vectors**, explicitly *not*
  OpenSearch Serverless — OpenSearch Serverless was ruled out due to its
  standing per-hour OCU cost. `infrastructure/modules/core-engine/rag-knowledge-base.tf`
  now provisions `aws_s3vectors_vector_bucket`, `aws_s3vectors_index`, and a
  real `aws_bedrockagent_knowledge_base` (type `VECTOR`, storage type
  `S3_VECTORS`) with an `aws_bedrockagent_data_source` pointed at the RAG
  S3 bucket.

### Added
- Initial Terraform scaffold: `core-engine` module (API Gateway, shared
  Bedrock-helper Lambda layer, Step Functions exec role, RAG S3 bucket + IAM
  role) and `feature` module (DynamoDB table, AI-call/postprocess Lambdas,
  Step Functions state machine, API Gateway route).
- `demo` environment root module instantiating `core_engine` plus a first
  `document_extractor` feature instance.
- Shared `bedrock_helper` Lambda layer source (prompt loading, Bedrock
  invocation with retry/backoff, JSON-response validation).
- `extract-document` feature: prompt template, AI-call and postprocess
  Lambda handlers.
- Documentation: root `README.md`, `docs/architecture.md`,
  `docs/adding-a-feature.md`, module-level `README.md` files.

### Known gaps
- No remote Terraform state backend configured yet (stubbed, commented out,
  in `infrastructure/environments/demo/main.tf`).
- No frontend/landing pages yet.
- No automated tests or CI for Lambda handlers.
