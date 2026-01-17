# Terraform - GitHub Secrets Sync

Simple Terraform setup to sync your `.env` secrets to GitHub Actions.

## Quick Start

### 1. Generate terraform.tfvars

```bash
npm run terraform:setup
```

This automatically:
- Reads your `frontend/.env` file
- Extracts your GitHub token from `gh` CLI
- Creates `terraform.tfvars` with all secrets

### 2. Initialize Terraform

```bash
npm run terraform:init
```

### 3. Apply (Sync to GitHub)

```bash
npm run terraform:apply
```

Type `yes` when prompted.

## One-Command Sync

After initial setup, use:

```bash
npm run terraform:sync
```

This regenerates `terraform.tfvars` from `.env` and applies changes.

## What Gets Synced

All `VITE_*` prefixed environment variables from your `frontend/.env` file are synced to GitHub Actions secrets.

Check them at: `https://github.com/softdaddy-o/valuehunt/settings/secrets/actions`

## Updating Secrets

1. Edit your `frontend/.env` file
2. Run `npm run terraform:sync`
3. Secrets automatically update in GitHub Actions

## Manual Configuration

If you prefer manual setup:

1. Copy `terraform.tfvars.example` to `terraform.tfvars`
2. Fill in your GitHub token
3. Copy secrets from `frontend/.env` to the `secrets{}` block
4. Run `terraform init && terraform apply`

## Requirements

- Terraform installed (`choco install terraform` on Windows)
- GitHub CLI authenticated (`gh auth login`)
- GitHub token with `repo` scope

## Troubleshooting

**"Error: Unauthorized"**
- Check your GitHub token has `repo` scope
- Re-run `gh auth login` if needed

**"Secrets not updating"**
```bash
cd terraform
terraform refresh
terraform apply
```

**Starting fresh**
```bash
cd terraform
terraform destroy
terraform apply
```

## Files

- `main.tf` - Terraform configuration
- `variables.tf` - Variable definitions
- `terraform.tfvars` - Your actual values (git-ignored)
- `terraform.tfvars.example` - Template
- `modules/github-secrets/` - GitHub secrets sync module
