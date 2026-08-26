output "api_endpoint" {
  description = "Base URL of the shared API Gateway."
  value       = module.core_engine.api_endpoint
}

output "document_extractor_route" {
  description = "Full path for the document-extractor feature."
  value       = module.document_extractor.route_path
}

output "review_analyzer_route" {
  description = "Full path for the analyze-reviews feature."
  value       = module.review_analyzer.route_path
}

output "bookkeeping_tracker_route" {
  description = "Full path for the bookkeeping-query feature."
  value       = module.bookkeeping_tracker.route_path
}
