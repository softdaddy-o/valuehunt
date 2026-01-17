/**
 * GitHub Secrets Module
 *
 * Syncs secrets from local .env to GitHub Actions
 */

terraform {
  required_providers {
    github = {
      source  = "integrations/github"
      version = "~> 6.0"
    }
  }
}

variable "repository" {
  description = "GitHub repository name"
  type        = string
}

variable "secrets" {
  description = "Map of secret names to values"
  type        = map(string)
  sensitive   = true
}

# Use nonsensitive() only for iteration keys, values remain protected
resource "github_actions_secret" "secrets" {
  for_each = {
    for key, value in nonsensitive(var.secrets) :
    key => value
    if startswith(key, "VITE_")
  }

  repository      = var.repository
  secret_name     = each.key
  plaintext_value = each.value
}

output "secret_names" {
  description = "List of secret names created"
  value       = keys(github_actions_secret.secrets)
}
