# Feature-specific state machine. Follows the shared core-engine skeleton:
#   receive input -> validate -> call AI (Lambda) -> parse/store result -> respond
# Only the Lambda ARN(s) referenced in the definition change between features.

resource "aws_sfn_state_machine" "this" {
  name     = "${var.feature_name}-${var.environment}"
  role_arn = var.step_functions_exec_role_arn
  # EXPRESS is required for the API Gateway integration's
  # StartSyncExecution subtype (see api-route.tf) - STANDARD state machines
  # don't support synchronous execution.
  type = "EXPRESS"

  definition = jsonencode({
    Comment = "Core engine pattern: validate -> AI call -> store -> respond"
    StartAt = "Validate"
    States = {
      Validate = {
        Type = "Pass"
        Next = "CallAI"
      }
      CallAI = {
        Type     = "Task"
        Resource = aws_lambda_function.ai_call.arn
        Next     = var.has_postprocess_lambda ? "StoreResult" : "Respond"
        Retry = [{
          ErrorEquals     = ["States.TaskFailed"]
          IntervalSeconds = 2
          MaxAttempts     = 2
          BackoffRate     = 2.0
        }]
      }
      StoreResult = var.has_postprocess_lambda ? {
        Type     = "Task"
        Resource = aws_lambda_function.postprocess[0].arn
        Next     = "Respond"
      } : null
      Respond = {
        Type = "Succeed"
      }
    }
  })

  tags = merge(var.tags, { Feature = var.feature_name })
}
