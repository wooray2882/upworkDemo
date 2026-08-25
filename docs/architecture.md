# Architecture

## Goal

Provision a reusable AWS-native "core engine" once via Terraform, then add
new portfolio demos as thin feature layers on top — a new demo should mean
writing one prompt and one small Terraform module instance, not rebuilding
infrastructure.

## Component overview

```
                         ┌─────────────────────────┐
   client / frontend ──▶ │   API Gateway (HTTP API) │
                         │   one route per feature   │
                         └────────────┬─────────────┘
                                      │
                         ┌────────────▼─────────────┐
                         │   Step Functions           │
                         │   (per-feature state machine,
                         │    shared skeleton)          │
                         │  validate → AI call → store  │
                         └───┬──────────────────┬──────┘
                             │                  │
                   ┌─────────▼──────┐   ┌───────▼─────────┐
                   │ AI-call Lambda  │   │ Postprocess Lambda │
                   │ (uses shared    │   │ (writes DynamoDB +  │
                   │  Bedrock layer) │   │  RAG data source)     │
                   └─────────┬───────┘   └───────┬─────────────┘
                             │                    │
                   ┌─────────▼───────┐  ┌─────────▼──────────┐
                   │ Amazon Bedrock   │  │ DynamoDB (per-feature)│
                   └──────────────────┘  │ + S3 → Bedrock KB (RAG)│
                                          └────────────────────────┘
```

## Core engine (`infrastructure/modules/core-engine`)

Provisioned once per environment. Shared by every feature:

- **API Gateway** — single HTTP API; every feature adds a route, not a new API.
- **Shared Lambda layer** — the Bedrock-call helper (auth, retry/backoff,
  JSON-response validation) lives in one place. Feature Lambdas import it
  instead of re-implementing the Bedrock client.
- **Step Functions exec role** — shared IAM role; the state machine
  *definition* is per-feature but always follows the same shape:
  `receive input → validate → call AI (Lambda) → parse/store result → respond`.
- **RAG layer (Bedrock Knowledge Base + S3 Vectors)** — feature results are
  written to S3, ingested by a Bedrock Knowledge Base, and embedded into an
  S3 Vectors index so the frontend can support conversational follow-up
  questions ("what did the angriest reviewer say") instead of one-shot JSON
  only. The vector store is **S3 Vectors, not OpenSearch Serverless** —
  OpenSearch Serverless carries a standing per-hour OCU cost even at rest,
  which is a poor fit for a demo platform that sits idle between job
  applications. S3 Vectors has no standing compute cost.

## Feature module (`infrastructure/modules/feature`)

Instantiated once per demo. Each instance provisions:

- One DynamoDB table, generic schema: `id`, `created_at`,
  `raw_input_summary`, `structured_result` (JSON), `feature_type`.
- One AI-call Lambda (feature-specific prompt + expected response shape),
  optionally one post-process Lambda.
- One Step Functions state machine following the shared skeleton.
- One API Gateway route on the shared API.

Adding a feature is: one new prompt file, one Lambda handler (usually a
prompt/parsing change on a copied template), one `module "..." {}` block in
`infrastructure/environments/demo/main.tf`. See
[`adding-a-feature.md`](adding-a-feature.md).

## Data flow (document-extractor example)

1. Client `POST`s to `<api>/extract-document` with raw document text.
2. API Gateway starts a synchronous Step Functions execution.
3. `Validate` state passes input through (extend with real validation as needed).
4. `CallAI` invokes the AI-call Lambda, which loads the feature's prompt
   template and calls Bedrock via the shared helper layer.
5. `StoreResult` invokes the post-process Lambda, which writes the result to
   the feature's DynamoDB table (and, in the full implementation, to the RAG
   S3 data source for the knowledge base to ingest).
6. `Respond` returns the result synchronously to the client.
7. Separately, the frontend can query the RAG knowledge base for
   conversational follow-up over accumulated results.

## Design decisions and trade-offs

| Decision | Rationale |
|---|---|
| S3 Vectors vs. OpenSearch Serverless | S3 Vectors has no standing compute cost (pay for storage/queries only); OpenSearch Serverless bills OCUs even idle. Explicitly excluded from this platform. |
| One shared API Gateway vs. one per feature | Matches "same deployment pattern" goal; keeps CORS/auth/logging config in one place. |
| Step Functions Standard vs. sync Express | Feature routes use `StartSyncExecution` (Express-compatible) for request/response latency; long-running features can switch per-instance. |
| DynamoDB generic schema | Lets the RAG ingestion path and any future cross-feature query be written once instead of per-feature. |
| No auth in this scaffold | Demo scope explicitly excludes it; the module boundary (API Gateway route + Lambda) is where an authorizer would attach later without a rewrite. |
| Local Terraform state initially | Fastest path to first `apply`; the `backend "s3"` block is stubbed in `environments/demo/main.tf` for when this needs to be shared/durable. |

## Validating the design: bookkeeping/revenue tracker

This feature is a useful stress test of the platform because it goes beyond
one-shot extraction: batches of transactions get ingested (same extraction
pattern as any other feature), and the RAG layer is what makes ongoing
questions like "how much did I spend on software last month" possible,
proving the shared engine handles both one-shot structured extraction and
conversational querying over accumulated data without a different backend
shape.
