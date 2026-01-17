/**
 * Terraform Outputs
 *
 * Values to display after successful apply
 */

output "github_repository" {
  description = "GitHub repository full name"
  value       = "${var.github_owner}/${var.github_repository}"
}

output "secrets_synced" {
  description = "Number of secrets synced to GitHub"
  value       = length(module.github_secrets.secret_names)
}
