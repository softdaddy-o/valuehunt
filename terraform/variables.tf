/**
 * Terraform Variables
 *
 * Simple configuration for syncing secrets to GitHub Actions
 */

variable "github_token" {
  description = "GitHub personal access token with repo permissions"
  type        = string
  sensitive   = true
}

variable "github_owner" {
  description = "GitHub repository owner (username or organization)"
  type        = string
  default     = "softdaddy-o"
}

variable "github_repository" {
  description = "GitHub repository name"
  type        = string
  default     = "valuehunt"
}

variable "secrets" {
  description = "Map of secrets to sync to GitHub Actions (from .env file)"
  type        = map(string)
  sensitive   = true
  default     = {}
}
