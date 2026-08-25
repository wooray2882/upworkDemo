# Changelog

All notable changes to this platform are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

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
- Bedrock Knowledge Base vector store backend not yet implemented (documented
  as an open decision in `infrastructure/modules/core-engine/rag-knowledge-base.tf`).
- No remote Terraform state backend configured yet (stubbed, commented out,
  in `infrastructure/environments/demo/main.tf`).
- No frontend/landing pages yet.
- No automated tests or CI for Lambda handlers.
