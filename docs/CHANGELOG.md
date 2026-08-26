# Changelog

All notable changes to this platform are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added (branch: `feat/wire-frontend-to-real-backend`)
- `frontend/js/config.js` (deployed `API_BASE_URL`) and
  `frontend/js/real-api.js` (a real API client calling the deployed API
  Gateway routes, returning the same shape `MockAPI.executeStepFunction()`
  did so the existing drawer-logging code needed no changes).
- Wired all three views' "run" actions
  (`DocumentExtractView.reRunExtraction`, `ReviewAnalyzerView.analyzeBatch`,
  `BookkeepingView.simulateBatchUpload`) to call `RealAPI` with real
  request bodies (`document_text`/`reviews_text`/`transactions_text`)
  instead of the mocked `MockAPI.executeStepFunction()` calls, and to
  display the real Bedrock-extracted result. Read-only initial table/chart
  data (`MockAPI.getBookkeepingData/getReviewData/getDocumentPresets`) is
  intentionally left as local sample data — there is no GET route to list
  stored records back from DynamoDB (out of scope for this pass).
- Verified end-to-end against the deployed backend via the actual browser
  UI: all three routes return real Bedrock-extracted results and the
  AWS API inspector panel shows real execution ARNs and `SUCCEEDED` status.
- Added `.claude/launch.json` (local static frontend server on port 3000).

### Fixed (branch: `core/fix-dynamodb-float-serialization`)
- `bookkeeping-query` (the first feature whose Bedrock output contains
  float fields, e.g. `amount`) failed with `TypeError: Float types are
  not supported. Use Decimal types instead.` on `table.put_item()` — boto3's
  DynamoDB resource API rejects native Python floats. Added
  `bedrock_helper.to_dynamodb_safe()` (recursive float→Decimal
  conversion) and applied it in all three `postprocess/handler.py` files.
  Also discovered the postprocess Lambdas never had the shared Bedrock
  helper layer attached at all (`modules/feature/lambda.tf`) — added it.
  Confirmed fixed with a real bookkeeping-query request.

### Fixed (branch: `core/fix-lambda-event-shape`)
- A "successful" end-to-end test returned an empty result
  (`document_type: null, key_fields: {}`). Traced via CloudWatch logs: all
  three AI-call handlers assumed an API-Gateway-proxy-style event
  (`event["body"]` as a JSON string) and did `json.loads(event.get("body")
  or "{}")`. But these Lambdas are invoked as Step Functions Tasks, not
  directly by API Gateway - the API Gateway integration maps
  `$request.body` straight into the state machine's `Input`, so `event` IS
  the parsed request body already (e.g. `{"document_text": "..."}"`), not
  `{"body": "..."}`. `event.get("body")` was always `None`, silently
  producing an empty prompt. Fixed all three
  `lambdas/*/ai-call/handler.py` files to read fields directly off
  `event`. Confirmed with a real end-to-end test returning correctly
  populated extraction fields.

### Fixed (branch: `core/fix-dynamodb-lambda-permissions`)
- Live testing surfaced `AccessDeniedException: ... not authorized to
  perform: dynamodb:PutItem`. The shared Lambda exec role
  (core-engine) never had any DynamoDB permissions - core-engine can't
  know feature table names ahead of time. Added
  `lambda_exec_role_name` output to core-engine and a
  `dynamodb_access` inline policy in `modules/feature/dynamodb-table.tf`
  that each feature attaches to the shared role, scoped to its own table
  ARN. Wired `lambda_exec_role_name` through all three feature instances
  in `infrastructure/environments/demo/main.tf`.

### Fixed (branch: `core/fix-bedrock-json-code-fences`)
- Live testing surfaced `ValueError: Bedrock call failed after retries:
  Expecting value: line 1 column 1 (char 0)`. Reproduced directly against
  Bedrock (`aws bedrock-runtime invoke-model`) with the real
  document-extractor prompt: `us.anthropic.claude-sonnet-4-6` wraps its
  JSON output in ` ```json ... ``` ` code fences despite the prompt's
  explicit "return ONLY valid JSON" instruction. Added
  `bedrock_helper._strip_code_fences()`, applied before `json.loads()` in
  `invoke_model()`. Verified against the captured raw model response.

### Fixed (branch: `core/fix-prompt-loading-in-lambda`)
- Live testing surfaced `FileNotFoundError: [Errno 2] No such file or
  directory: '../../../prompts/document-extractor.txt'`. Every AI-call
  Lambda's `PROMPT_PATH` env var held a path that only exists on the
  machine running `terraform apply` (relative to the Terraform module),
  not inside the deployed Lambda package. Fixed by reading the prompt file
  into a `PROMPT_TEXT` env var at apply time (`file(var.prompt_path)` in
  `infrastructure/modules/feature/lambda.tf`) and templating it in-Lambda —
  renamed `bedrock_helper.load_prompt(path, **kwargs)` (file I/O) to
  `render_prompt(template, **kwargs)` (string templating only), and
  updated all three feature `ai-call/handler.py` files to match.

### Fixed (branch: `core/fix-sfn-lambda-invoke-policy`)
- Live testing surfaced `AccessDeniedException: ... is not authorized to
  perform lambda:InvokeFunction`. The shared Step Functions exec role's
  policy scoped `Resource` to `arn:aws:lambda:*:*:function:${var.project_name}-*`,
  but feature Lambdas are named `<feature_name>-*` (e.g.
  `extract-document-ai-call-demo`), not `<project_name>-*` — and
  core-engine, by design, doesn't know feature names ahead of time.
  Rescoped to `Resource = "*"` in
  `infrastructure/modules/core-engine/step-functions-template.tf`.

### Fixed (branch: `core/fix-express-state-machine`)
- A live end-to-end test against the deployed API (`POST /extract-document`)
  returned `StateMachineTypeNotSupported: This operation is not supported by
  this type of state machine`. The API Gateway integration uses
  `StartSyncExecution` (see `infrastructure/modules/feature/api-route.tf`),
  which only works against **Express** state machines — the feature module's
  `aws_sfn_state_machine` had no `type` set, defaulting to `STANDARD`. Added
  `type = "EXPRESS"` to `infrastructure/modules/feature/step-function.tf`.

### Fixed (branch: `core/fix-embedding-model-arn-region`)
- `terraform apply` against a real AWS account (000622214837) rejected the
  embedding model ARN `arn:aws:bedrock:*::foundation-model/...` — Bedrock's
  `CreateKnowledgeBase` validates this ARN against a regex that does not
  allow a wildcard region. Added `data "aws_region" "current"` to
  `rag-knowledge-base.tf` and built the ARN with the real region
  (`arn:aws:bedrock:${data.aws_region.current.region}::foundation-model/...`).
  Confirmed with a successful `terraform apply` (46 resources created,
  including the Bedrock Knowledge Base and S3 Vectors index) against the
  real account.

### Fixed (branch: `core/fix-bedrock-model-id`)
- `bedrock_helper.py`'s default model ID (`anthropic.claude-3-haiku-20240307-v1:0`)
  is deprecated/legacy in this AWS account and returns `ResourceNotFoundException`
  on invoke. Confirmed via a live `aws bedrock-runtime invoke-model` test, not
  assumed. Switched to `us.anthropic.claude-sonnet-4-6`, a cross-region
  inference profile ID (direct on-demand invocation of
  `anthropic.claude-sonnet-4-6` is rejected — Bedrock requires the
  inference profile ID for this model), confirmed working with a live
  invoke. Updated the (currently unwired) `bedrock_model_id` Terraform
  variable default to match for documentation purposes.

### Added (branch: `feature/bookkeeping-query`)
- `bookkeeping-query` feature: prompt template, AI-call and postprocess
  Lambda handlers, wired into `infrastructure/environments/demo/main.tf`.
  This is the "harder case" from the design doc — validates that the same
  extraction pattern plus the shared RAG layer supports ongoing
  conversational queries over accumulated records (e.g. "how much did I
  spend on software last month"), not just one-shot extraction.

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
