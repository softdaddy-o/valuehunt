/**
 * Terraform Variables
 */

# =============================================================================
# GitHub Configuration
# =============================================================================

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

# =============================================================================
# Google Cloud Configuration
# =============================================================================

variable "gcp_org_id" {
  description = "Google Cloud Organization ID"
  type        = string
}

variable "gcp_billing_account" {
  description = "Google Cloud Billing Account ID"
  type        = string
}

variable "gcp_region" {
  description = "Google Cloud region"
  type        = string
  default     = "us-central1"
}

variable "gcp_credentials" {
  description = "Path to GCP service account credentials JSON"
  type        = string
  sensitive   = true
}

# =============================================================================
# API Keys
# =============================================================================

variable "dart_api_key" {
  description = "DART API key for Korean stock market data"
  type        = string
  sensitive   = true
}

variable "secrets" {
  description = "Additional secrets to sync to GitHub Actions"
  type        = map(string)
  sensitive   = true
  default     = {}
}
