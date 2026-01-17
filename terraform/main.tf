/**
 * ValueHunt Infrastructure as Code
 *
 * Manages:
 * - GitHub Actions secrets (synced from local .env)
 * - Simple, straightforward secret management
 */

terraform {
  required_version = ">= 1.0"

  required_providers {
    github = {
      source  = "integrations/github"
      version = "~> 6.0"
    }
  }

  # Store state in Terraform Cloud (optional)
  # Uncomment and configure after creating workspace
  # backend "remote" {
  #   organization = "your-org"
  #   workspaces {
  #     name = "valuehunt"
  #   }
  # }
}

# GitHub Provider
provider "github" {
  token = var.github_token
  owner = var.github_owner
}

# Module: GitHub Actions Secrets
# Syncs secrets from var.secrets to GitHub Actions
module "github_secrets" {
  source = "./modules/github-secrets"

  repository = var.github_repository
  secrets    = var.secrets
}
