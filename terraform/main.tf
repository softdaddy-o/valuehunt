/**
 * ValueHunt Infrastructure as Code
 *
 * Resources managed:
 * - GCP Project with Gemini API access
 * - Service account and API key for AI integration
 * - GitHub Actions secrets (auto-synced from Terraform outputs)
 */

terraform {
  required_version = ">= 1.0"

  required_providers {
    github = {
      source  = "integrations/github"
      version = "~> 6.0"
    }
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

# GitHub Provider
provider "github" {
  token = var.github_token
  owner = var.github_owner
}

# Google Cloud Provider
provider "google" {
  region      = var.gcp_region
  credentials = file(var.gcp_credentials)
}

# =============================================================================
# Random Resources
# =============================================================================

resource "random_id" "project_suffix" {
  byte_length = 4
}

resource "random_password" "jwt_secret" {
  length  = 64
  special = true
}

resource "random_password" "secret_key" {
  length  = 64
  special = true
}

# =============================================================================
# GCP Project
# =============================================================================

resource "google_project" "valuehunt" {
  name            = "valuehunt"
  project_id      = "valuehunt-${random_id.project_suffix.hex}"
  org_id          = var.gcp_org_id
  billing_account = var.gcp_billing_account
}

# =============================================================================
# GCP API Services
# =============================================================================

locals {
  required_apis = [
    "iam.googleapis.com",
    "aiplatform.googleapis.com",
    "generativelanguage.googleapis.com",
    "apikeys.googleapis.com",
  ]
}

resource "google_project_service" "apis" {
  for_each = toset(local.required_apis)

  project            = google_project.valuehunt.project_id
  service            = each.value
  disable_on_destroy = false
}

# =============================================================================
# Service Account and API Keys
# =============================================================================

resource "google_service_account" "gemini" {
  project      = google_project.valuehunt.project_id
  account_id   = "valuehunt-gemini"
  display_name = "ValueHunt Gemini API Service Account"
  description  = "Service account for Gemini API access"

  depends_on = [google_project_service.apis]
}

resource "google_project_iam_member" "gemini_ai_user" {
  project = google_project.valuehunt.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.gemini.email}"
}

resource "google_service_account_key" "gemini_key" {
  service_account_id = google_service_account.gemini.name
}

resource "google_apikeys_key" "gemini" {
  name         = "gemini-api-key"
  display_name = "ValueHunt Gemini API Key"
  project      = google_project.valuehunt.project_id

  restrictions {
    api_targets {
      service = "generativelanguage.googleapis.com"
    }
  }

  depends_on = [google_project_service.apis]
}

# =============================================================================
# GitHub Actions Secrets
# =============================================================================

locals {
  github_secrets = merge(var.secrets, {
    JWT_SECRET                          = random_password.jwt_secret.result
    SECRET_KEY                          = random_password.secret_key.result
    GOOGLE_CLOUD_PROJECT                = google_project.valuehunt.project_id
    GOOGLE_APPLICATION_CREDENTIALS_JSON = base64decode(google_service_account_key.gemini_key.private_key)
    GEMINI_API_KEY                      = google_apikeys_key.gemini.key_string
    DART_API_KEY                        = var.dart_api_key
  })
}

module "github_secrets" {
  source = "./modules/github-secrets"

  repository = var.github_repository
  secrets    = local.github_secrets
}
