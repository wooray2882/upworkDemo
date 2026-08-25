# Runbook: adding a new feature/demo

Target: read a job posting, identify which existing pattern it's closest to
(extraction / conversational query over data / classification-and-response),
and have a working demo link within an hour or two.

## Steps

1. **Write the prompt.**
   Create `prompts/<feature-name>.txt` describing the extraction/analysis
   task and the exact JSON shape the model should return. Copy an existing
   prompt (e.g. `prompts/document-extractor.txt`) as a starting point.

2. **Create the Lambda source.**
   ```
   lambdas/<feature-name>/ai-call/handler.py
   lambdas/<feature-name>/postprocess/handler.py   # if the feature stores results
   ```
   Copy `lambdas/extract-document/*` and adjust: what input fields it reads
   from the request body, and what it passes to `invoke_model`/`load_prompt`.
   The Bedrock client, retries, and JSON validation are already handled by
   the shared `bedrock_helper` layer — don't reimplement them.

3. **Instantiate the feature module.**
   In `infrastructure/environments/demo/main.tf`, add:
   ```hcl
   module "<feature_name>" {
     source = "../../modules/feature"

     feature_name       = "<feature-name>"
     prompt_path        = "../../../prompts/<feature-name>.txt"
     lambda_source_dir  = "../../../lambdas/<feature-name>"
     has_postprocess_lambda = true # if applicable
     environment        = "demo"
     tags                = local.common_tags

     api_id                        = module.core_engine.api_id
     api_execution_arn             = module.core_engine.api_execution_arn
     lambda_exec_role_arn          = module.core_engine.lambda_exec_role_arn
     bedrock_helper_layer_arn      = module.core_engine.bedrock_helper_layer_arn
     step_functions_exec_role_arn  = module.core_engine.step_functions_exec_role_arn
   }
   ```

4. **Deploy.**
   ```bash
   cd infrastructure/environments/demo
   terraform plan
   terraform apply
   ```

5. **Build the landing page.**
   One page pointed at `<api_endpoint>/<feature-name>`, with its own
   copy/branding, plus a chat-style input for RAG follow-up questions where
   relevant. Follow whatever visual pattern the first landing page
   established — no fixed page count to plan around.

6. **Smoke test.**
   `POST` a synthetic sample to the route and confirm a result lands in the
   feature's DynamoDB table.

## What NOT to touch

Do not modify `infrastructure/modules/core-engine/*` for a single feature's
needs. If a change there seems necessary, it likely means the shared skeleton
is missing a capability every feature needs — raise that explicitly rather
than special-casing it in one feature module.
