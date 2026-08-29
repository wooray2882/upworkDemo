# Static frontend hosting: S3 (private, no public bucket policy) fronted
# by CloudFront (Origin Access Control), so the demo has a real public
# HTTPS URL to share - not just localhost. Deliberately NOT S3 static
# website hosting alone: that only serves plain HTTP, and a plain-HTTP
# link handed to a client for a portfolio piece looks unprofessional even
# though it works (an http:// page calling this app's https:// API isn't
# a mixed-content problem - browsers only block the other direction).
#
# Cost: CloudFront's free tier (1TB data transfer + 10M HTTP/HTTPS
# requests per month) is AWS's permanent "always free" tier, not a
# 12-month trial - a portfolio-demo's traffic won't come close to it, so
# this should run at effectively $0. PriceClass_100 (US/Canada/Europe
# edge locations only) keeps it that way even outside the free tier.
#
# URL scheme: one CloudFront domain serves the whole app. The bare URL
# shows every feature (for working across all three); ?app=bookkeeping,
# ?app=document-extract, or ?app=review-analyzer locks the nav down to
# just that one feature (see frontend/js/app.js applyFocusMode()) - for
# sending a client a link scoped to only what's relevant to them, without
# a separate deployment or distribution per feature.

resource "aws_s3_bucket" "frontend" {
  bucket = "upwork-demo-demo-frontend"
  tags   = local.common_tags
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket                  = aws_s3_bucket.frontend.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "upwork-demo-demo-frontend-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  default_root_object = "index.html"
  price_class         = "PriceClass_100" # US/Canada/Europe only - cheapest tier, plenty for a demo

  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id                = "frontend-s3"
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "frontend-s3"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = true # ?app=... must reach the origin unmodified
      cookies {
        forward = "none"
      }
    }
  }

  # A future direct link to a nonexistent path (not one of our ?app=
  # query params) should still land on the SPA shell, not a raw S3 XML
  # error page.
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = local.common_tags
}

resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "cloudfront.amazonaws.com" }
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.frontend.arn}/*"
      Condition = {
        StringEquals = {
          "AWS:SourceArn" = aws_cloudfront_distribution.frontend.arn
        }
      }
    }]
  })
}

# Syncs the frontend/ directory to S3 and invalidates CloudFront's cache
# whenever any frontend file changes (tracked via a hash of the whole
# directory) - `aws s3 sync` handles per-file content-type detection and
# only uploads what changed, which a per-file Terraform resource
# (aws_s3_object per asset) would need to reimplement manually.
resource "null_resource" "frontend_deploy" {
  triggers = {
    content_hash = sha1(join("", [for f in fileset("${path.module}/../../../frontend", "**") : filesha1("${path.module}/../../../frontend/${f}")]))
  }

  provisioner "local-exec" {
    # Cache-Control: no-cache forces both the browser and CloudFront to
    # revalidate (via ETag) on every request instead of serving a stale
    # copy from local disk cache - without this header S3/CloudFront send
    # none, so browsers fall back to heuristic caching and can keep
    # serving old JS/CSS for hours after a deploy + invalidation.
    command = <<-EOT
      aws s3 sync ${path.module}/../../../frontend s3://${aws_s3_bucket.frontend.bucket} --delete --cache-control "no-cache, must-revalidate"
      aws cloudfront create-invalidation --distribution-id ${aws_cloudfront_distribution.frontend.id} --paths "/*"
    EOT
  }

  depends_on = [aws_s3_bucket_policy.frontend]
}
