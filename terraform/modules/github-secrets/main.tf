/**
 * GitHub Secrets Module
 *
 * Syncs secrets to GitHub Actions repository secrets.
 */

terraform {
  required_providers {
    github = {
      source  = "integrations/github"
      version = "~> 6.0"
    }
  }
}

# =============================================================================
# Variables
# =============================================================================

variable "repository" {
  description = "GitHub repository name"
  type        = string
}

variable "secrets" {
  description = "Map of secret names to values"
  type        = map(string)
  sensitive   = true
}

# =============================================================================
# Resources
# =============================================================================

resource "github_actions_secret" "secrets" {
  for_each = nonsensitive(toset(keys(var.secrets)))

  repository      = var.repository
  secret_name     = each.key
  plaintext_value = var.secrets[each.key]
}

# =============================================================================
# Outputs
# =============================================================================

output "secret_names" {
  description = "List of secret names created"
  value       = keys(var.secrets)
  sensitive   = true
}
