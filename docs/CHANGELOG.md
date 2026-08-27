# Changelog

All notable changes to this platform are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Changed (branch: `feature/real-input-for-reviews-and-bookkeeping`)
- Neither "Re-Analyze Review Stream" nor "Upload Invoices Batch" ever let a
  real user submit their own data - both only resubmitted the same fixed
  `MockAPI` sample text on every click, with no way to test the feature
  against anything else. Added `components/text-submit-modal.js` (a
  generic paste-your-own-data dialog on the `Modal` component, with an
  optional "Use example text" button) and wired it into both views:
  `ReviewAnalyzerView.openSubmitModal()` and
  `BookkeepingView.openSubmitModal()` replace `analyzeBatch()`/
  `simulateBatchUpload()`. Verified live: typed a real custom review and a
  real custom transaction, submitted both, and confirmed each appeared
  correctly analyzed at the top of its table.

### Changed (branch: `feature/hover-chat-and-upload-modal`)
- The Insights Assistant panel was a fixed sidebar that squeezed the main
  canvas width, and its "collapsed" CSS state only became a real overlay
  under 1200px viewport width - above that it just reserved empty space
  instead of giving it back. Made the panel `position: fixed` always (a
  true hover-in overlay, out of the `.app-container` flex flow), so
  `.main-content` is full width whether the assistant is open or closed.
  Added a close (×) button in the chat header and a floating reopen bubble
  (bottom-right, shown only via a CSS sibling selector while collapsed -
  no JS state syncing needed). `App.toggleChatPanel()` already existed but
  had no UI wired to it before this.
- Fixed a real layout bug visible in production: the Category Breakdown
  donut chart's legend had no height cap and would overflow its card,
  visually spilling into neighboring panels once there were enough
  categories (real data had grown to 15+ once real records accumulated).
  Capped the legend at a scrollable `max-height` and added
  `overflow: hidden` to `.chart-container` as a backstop.
- Document Extractor rebuilt to match the other two trackers' shape - a
  table page, not a dual-pane upload/preview layout. Upload moved into a
  new `DocumentUploadModal` component (files only - no paste-text option,
  per explicit request - PDF or image, ~4MB cap) built on a new generic
  `Modal` component (`components/modal.js`) reused for both the upload
  dialog and the per-row "View Details" dialog. `DataTable` gained
  `renderDocumentsTable()` alongside its existing bookkeeping/review
  renderers. Verified end-to-end live: selected a real file, watched the
  modal close automatically, and confirmed the details modal opened with
  the correct extracted result and the table refreshed with the new row.

### Changed (branch: `feature/business-friendly-ui-copy`)
- The audience for this app is a business user (HR, ops, a manager) - not
  a developer - so two things were fixed:
  - `document-extract.js`: extraction results were shown as raw syntax-
    highlighted JSON. Replaced with a plain label/value rendering
    (`renderHumanSummary`/`renderFieldRows`/`renderFieldValue`) - snake_case
    keys become "Title Case" labels (with a small acronym list so "it"/"id"
    render as "IT"/"ID"), nested objects become sub-sections, arrays of
    objects become simple cards. No JSON syntax anywhere in this view now.
  - Removed every AWS/AI/infrastructure-jargon mention from user-facing
    copy across the whole app: page title, header brand name/tagline,
    status badge, the "Inspect AWS Payload" button and its drawer, the
    chat assistant's name/subtitle/placeholder/welcome message, and every
    view's heading/subtitle/toast text (e.g. "Route: /analyze-reviews —
    ... via AWS Bedrock" → "Automatically scores customer sentiment...").
    Verified nothing remains via a repo-wide grep for AWS/Bedrock/
    Terraform/Step Function/DynamoDB/Lambda/AI/JSON Schema across all
    user-facing files - the only remaining hits are code comments, not
    displayed text.
  - The one exception left alone on purpose: the "View Activity Log"
    drawer's *content* (request/response/execution details) stays
    technical - it's an explicit opt-in panel, not primary UI copy.

### Added (branch: `core/wire-rag-chat-to-knowledge-base`)
- The Bedrock Knowledge Base (S3 Vectors-backed) was provisioned but had
  never been populated - closed that gap: exported all 18 real DynamoDB
  records to text, uploaded them to `upwork-demo-demo-rag-data` (the S3
  data source), and ran a real ingestion job via
  `bedrock-agent.start_ingestion_job` - completed 18/18 indexed, 0 failed.
  Verified independently against the S3 Vectors API (23 vectors now
  stored - chunking split some docs) and via `bedrock-agent-runtime.retrieve`
  (correct top result by similarity score, not keyword match) before
  touching any application code.
- `lambdas/rag-query/handler.py` rewritten from the DynamoDB-scan
  workaround to a real `retrieve_and_generate` call against the knowledge
  base - real vector search + a grounded answer with citations pointing
  at the actual ingested S3 files.
- `modules/core-engine/rag-knowledge-base.tf`: new `bedrock_kb_query` IAM
  policy on the shared exec role (`bedrock:Retrieve`,
  `bedrock:RetrieveAndGenerate`, and `bedrock:GetInferenceProfile` -  the
  last one only surfaced via a live `AccessDeniedException` after the
  first two alone weren't sufficient; `RetrieveAndGenerate` resolves a
  cross-region inference profile ARN via `GetInferenceProfile` internally).
- `modelArn` must be the full inference-profile ARN, not the bare model id
  string `invoke_model()` accepts elsewhere in this codebase - confirmed
  live before wiring it into Terraform, not assumed.
- Frontend `rag-chat.js`: citations now render as the real S3 URIs
  returned by the backend, and clicking one highlights the actual matching
  table row(s) (the `<type>-<uuid>.txt` filename embeds the same id
  DynamoDB-derived table rows use) - verified live: a real citation
  correctly highlighted 5 real rows from the same source batch.

### Added (branch: `feature/wire-remaining-mock-data`)
- Removed every remaining mock/fabricated display in the frontend:
  - `bookkeeping.js`: removed the hardcoded "Total Revenue" and "Net Margin"
    KPI cards (there is no revenue field anywhere in the bookkeeping-query
    schema - it's an expense extractor, not a P&L tool). Replaced with real
    "Average Transaction" and "Categories Tracked" computed from live data.
  - `charts.js`: `renderLineChart` previously ignored its `data` parameter
    entirely and drew hardcoded revenue/expense numbers. Rewritten as a
    single real "Monthly Expense Trend" series computed from actual
    transaction dates/amounts. `renderDonutChart`'s hardcoded fallback now
    only triggers on genuinely empty data instead of silently overriding
    real categories.
  - `document-extract.js`: removed the three canned preset documents
    (Invoice/Receipt/W-2) that displayed fabricated `extractedJSON` before
    any real extraction ran. Replaced with a real "Recent Extractions"
    list fetched from `GET /extract-document`, selectable to view the
    actual stored result, plus upload/paste-text inputs that only show
    real Bedrock output once run.
  - `rag-chat.js`: was fully mocked (`MockAPI.queryRAGKnowledgeBase`).
    Added `lambdas/rag-query/handler.py` + `infrastructure/environments/demo/rag-query.tf`
    (`POST /rag-query`) - scans the real DynamoDB table(s) for the active
    view and asks Bedrock to answer grounded in that data. This is a
    pragmatic scan-and-stuff RAG pattern, not the formal Bedrock Knowledge
    Base vector search provisioned in `rag-knowledge-base.tf` - nothing
    has ever been ingested into that index, so wiring the chat to it today
    would return empty results. Documented as a real follow-up, not
    silently skipped.
  - `bookkeeping.js` / `review-analyzer.js`: after a new batch is
    submitted, the view now re-fetches from DynamoDB immediately instead
    of only showing the new record after a full page reload.
- `bedrock_helper.py`: split `_invoke` into `_call_bedrock` (raw text, retry
  logic) + `_invoke` (JSON-parsing wrapper) and added `invoke_model_text`
  for the RAG query's plain-text conversational answers.
- Verified end-to-end in a real browser session after deploying: real KPIs,
  real charts, real Document Extractor history, and a real RAG chat answer
  correctly citing an actual stored transaction (DigitalOcean, $318.40) with
  honest uncertainty about category matching, not a canned response.

### Added (branch: `feature/read-path-dynamodb`)
- The platform only ever wrote to DynamoDB - there was no way to read
  stored records back out. Added a `list` Lambda per feature
  (`lambdas/*/list/handler.py`) that scans the feature's table directly
  and a `GET /<feature-name>` API Gateway route (plain Lambda proxy
  integration, not Step Functions - a read doesn't need orchestration).
- `infrastructure/modules/feature/lambda.tf`: new `aws_lambda_function.list`
  + log group, reusing the existing shared exec role (already has
  `dynamodb:Scan` on this feature's table from `dynamodb-table.tf`'s
  `dynamodb_access` policy - no new IAM needed).
- `infrastructure/modules/feature/api-route.tf`: new integration, route,
  and `aws_lambda_permission` for the GET route.
- Seeded realistic synthetic test data (10 documents, 4 review batches,
  4 bookkeeping batches) directly into the deployed DynamoDB tables via a
  one-off boto3 script, for interactive testing.
- Frontend: `RealAPI.listRecords()` and the Bookkeeping/Review views now
  fetch real stored records on load instead of only showing
  `MockAPI`'s static sample data.

### Added (branch: `feature/document-upload-ocr`)
- Real file upload support for `extract-document`: the AI-call Lambda now
  accepts `document_base64` + `media_type` (PDF or image) in addition to
  plain `document_text`. Claude reads the document directly via Bedrock's
  native `document`/`image` content blocks — this IS the OCR step, no
  separate Textract or OCR service involved. Verified live against both
  `application/pdf` and `image/png` via direct `invoke-model` calls before
  wiring it into the Lambda.
- Added `bedrock_helper.invoke_model_with_file()` and
  `render_file_mode_prompt()` (shared layer) and a
  `MAX_FILE_BASE64_BYTES` guard (~4.5MB) reflecting Lambda's 6MB
  synchronous invoke payload limit.
- Frontend: real file picker on the Document Extractor view, reading the
  file as base64 client-side and POSTing it to `/extract-document`.

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
