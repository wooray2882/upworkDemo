# upworkDemo — Reusable AWS-Native Demo Platform

A shared AWS-native platform — Terraform + Step Functions + a Bedrock RAG
core — provisioned once and reused to spin up new portfolio/client demos as
thin feature layers on top, rather than rebuilding infrastructure per demo.

## Why this exists

Most portfolio demos are one-off builds. This repo inverts that: the
infrastructure (API Gateway, Step Functions pattern, shared Bedrock-call
Lambda layer, RAG knowledge base, DynamoDB pattern) is built once. Adding a
new demo — matched to a specific job posting or use case — becomes: one
prompt, one feature module instance, one landing page. See
[`docs/architecture.md`](docs/architecture.md) for the full design rationale.

## Repository layout

```
infrastructure/
  modules/
    core-engine/       # Shared platform infra — instantiated once
    feature/            # Parameterized per-feature infra — instantiated per demo
  environments/
    demo/                # Root module: core-engine + one block per feature
lambdas/
  <feature-name>/
    ai-call/              # Calls Bedrock via the shared helper layer
    postprocess/           # Parses/stores the AI result (optional)
lambda-layers/
  bedrock-helper/          # Shared Bedrock client: auth, retries, JSON validation
prompts/
  <feature-name>.txt        # One prompt template per feature
docs/
  architecture.md            # Design rationale and component detail
  adding-a-feature.md         # Step-by-step runbook for a new demo
  CHANGELOG.md                  # Notable changes to this platform
```

## Prerequisites

- Terraform >= 1.7
- AWS CLI configured with credentials for the target account
- Python 3.12 (Lambda runtime)
- Access to the Bedrock model(s) referenced in `infrastructure/modules/core-engine/variables.tf` (enabled in the AWS Bedrock console for your account/region)

## Getting started

```bash
cd infrastructure/environments/demo
terraform init
terraform plan
terraform apply
```

On success, `terraform output api_endpoint` gives the base URL for the shared
API Gateway; each feature is reachable at `<api_endpoint>/<feature-name>`.

## Adding a new demo/feature

See [`docs/adding-a-feature.md`](docs/adding-a-feature.md).

## Branching

See [`docs/branching.md`](docs/branching.md) — every new feature gets its
own `feature/<feature-name>` branch; `main` stays deployable at all times.

## Scope and guardrails

This is a portfolio/demo platform, not a production system:

- Synthetic/sample data only — no real financial data or customer PII.
- Single-tenant, no auth on the demo endpoints (structured so adding auth
  later isn't a rewrite, but auth is not implemented here).
- Production concerns (encryption beyond AWS defaults, multi-tenant
  isolation, compliance rules) are discussed in interviews, not built here.
- The RAG knowledge base is intentionally demo-sized.

## Status

`infrastructure/modules/core-engine` and `infrastructure/modules/feature`
define the shared shape. Three feature instances exist so far, validating
the pattern across different problem shapes:

| Feature | Route | Validates |
|---|---|---|
| `extract-document` | `/extract-document` | Baseline one-shot extraction pattern |
| `analyze-reviews` | `/analyze-reviews` | Pattern generalizes to a second, differently-shaped extraction task |
| `bookkeeping-query` | `/bookkeeping-query` | Ingestion + the shared RAG layer answering conversational queries over accumulated records — the "harder case" (see `docs/architecture.md`) |

All three are merged into `main`, deployed to a real AWS account, and
verified working end-to-end: real Bedrock extraction, real Step Functions
orchestration, real DynamoDB storage. The `frontend/` dashboard is wired to
the live API (`frontend/js/real-api.js` + `frontend/js/config.js`) and was
tested through the actual browser UI for all three features.

Known gaps: no RAG conversational query wired into the frontend chat widget
yet (it's still on `MockAPI.queryRAGKnowledgeBase`); no GET routes to list
stored records back out of DynamoDB; no remote Terraform state backend.
