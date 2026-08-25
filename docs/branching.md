# Branching strategy

This repo uses **GitHub Flow**, adapted for the "core engine once, thin
feature layer per demo" model:

- **`main`** is always deployable. The core engine (`infrastructure/modules/core-engine`)
  and any feature already wired into `infrastructure/environments/demo/main.tf`
  on `main` should `terraform plan` cleanly.
- **Every new feature/demo gets its own branch**, named:
  ```
  feature/<feature-name>
  ```
  matching the `feature_name` used in the Terraform module instance (e.g.
  `feature/analyze-reviews`, `feature/bookkeeping-query`).
- **Core engine changes** (rare — see `infrastructure/modules/core-engine/README.md`)
  get their own branch, named `core/<short-description>`, e.g. `core/rag-s3-vectors`.
- Work happens on the branch, gets pushed, and merges to `main` via PR once:
  1. `terraform fmt -check -recursive` passes.
  2. `terraform validate` passes for `infrastructure/environments/demo`.
  3. The feature's docs are updated (`docs/CHANGELOG.md` at minimum; module
     README if the core engine changed).
- Do not commit new feature work directly to `main` — branch first, even for
  a single-commit change. The point is to keep `main` demoable at all times,
  since branches may be spun up mid-review of a live job posting.

## Naming reference

| Branch prefix | Used for | Example |
|---|---|---|
| `feature/<name>` | A new demo/feature module instance | `feature/analyze-reviews` |
| `core/<desc>` | Changes to `modules/core-engine` | `core/rag-s3-vectors` |
| `fix/<desc>` | Bug fixes not tied to a specific feature | `fix/lambda-timeout` |
