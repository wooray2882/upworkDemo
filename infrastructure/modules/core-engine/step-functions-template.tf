# Shared IAM role for Step Functions state machines. Individual state machine
# *definitions* live per-feature (modules/feature/step-function.tf) but all
# assume this role and follow the same skeleton:
#   receive input -> validate -> call AI (Lambda) -> parse/store result -> respond

resource "aws_iam_role" "step_functions_exec" {
  name = "${var.project_name}-${var.environment}-sfn-exec"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "states.amazonaws.com" }
    }]
  })

  tags = var.tags
}

resource "aws_iam_role_policy" "step_functions_invoke_lambda" {
  name = "${var.project_name}-sfn-invoke-lambda"
  role = aws_iam_role.step_functions_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "lambda:InvokeFunction"
      Resource = "arn:aws:lambda:*:*:function:${var.project_name}-*"
    }]
  })
}
