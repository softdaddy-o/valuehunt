/**
 * Terraform Outputs
 */

# =============================================================================
# GCP Infrastructure
# =============================================================================

output "gcp_project_id" {
  description = "GCP project ID"
  value       = google_project.valuehunt.project_id
}

output "gemini_service_account_email" {
  description = "Gemini service account email"
  value       = google_service_account.gemini.email
}

output "gemini_api_key_id" {
  description = "Gemini API key resource ID"
  value       = google_apikeys_key.gemini.id
}

output "gemini_api_key" {
  description = "Gemini API key value"
  value       = google_apikeys_key.gemini.key_string
  sensitive   = true
}

output "jwt_secret" {
  description = "Generated JWT secret"
  value       = random_password.jwt_secret.result
  sensitive   = true
}

output "secret_key" {
  description = "Generated backend secret key"
  value       = random_password.secret_key.result
  sensitive   = true
}

# =============================================================================
# GitHub Secrets
# =============================================================================

output "github_repository" {
  description = "GitHub repository full name"
  value       = "${var.github_owner}/${var.github_repository}"
}

output "secrets_synced_count" {
  description = "Number of secrets synced to GitHub Actions"
  value       = length(local.github_secrets)
  sensitive   = true
}

output "synced_secret_names" {
  description = "Names of secrets synced to GitHub Actions"
  value       = keys(local.github_secrets)
  sensitive   = true
}
