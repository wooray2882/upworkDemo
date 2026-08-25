# Contributing

This is a solo portfolio project, but it's built and documented like a team
project so it reads well in an interview and stays fast to extend.

## Workflow

1. **Branch first.** See [`docs/branching.md`](docs/branching.md) — a new
   feature/demo gets its own `feature/<feature-name>` branch off `main`; a
   core-engine change gets `core/<desc>`; a bug fix gets `fix/<desc>`.
2. **Follow the runbook for new features.** See
   [`docs/adding-a-feature.md`](docs/adding-a-feature.md).
3. **Before opening a PR / merging to `main`:**
   ```bash
   cd infrastructure
   terraform fmt -check -recursive
   cd environments/demo
   terraform init -backend=false
   terraform validate
   ```
4. **Update docs alongside code, not after.** At minimum, add an entry to
   [`docs/CHANGELOG.md`](docs/CHANGELOG.md) under `[Unreleased]`, tagged with
   the branch name. Update `docs/architecture.md` if the core engine changed,
   or the relevant module `README.md` if a module's inputs/outputs changed.
5. **Merge to `main` once `terraform plan` is clean** against the demo
   environment. `main` should always be in a state that could be `apply`'d.

## Commit style

Commit messages explain *why*, not just *what* — the diff already shows
what changed. Follow the existing history for tone and format.

## Code conventions

- **Terraform:** one resource group per concern per file (see the
  `core-engine` and `feature` modules for the existing file-naming
  convention: `api-gateway.tf`, `lambda.tf`, `dynamodb-table.tf`, etc.).
  Run `terraform fmt` before committing.
- **Lambda handlers (Python 3.12):** feature Lambdas import the shared
  `bedrock_helper` layer rather than reimplementing Bedrock calls, retries,
  or JSON validation. Keep feature-specific logic limited to prompt
  filling and response shaping.
- **Prompts:** one `.txt` file per feature in `prompts/`, with an explicit
  JSON schema in the prompt itself and a rule to return *only* JSON.

## Scope boundaries

Do not add authentication, multi-tenant isolation, or production-grade
encryption/compliance work to this repo — those are explicitly out of scope
for a demo platform (see `README.md`, "Scope and guardrails") and are
discussion points for interviews, not implementation tasks here.
