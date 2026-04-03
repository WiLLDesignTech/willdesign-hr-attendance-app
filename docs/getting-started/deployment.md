# Deployment Guide — Full AWS Setup

This guide walks you through deploying the HR Attendance App to your own AWS account, step by step. No prior AWS experience required.

## Prerequisites

- A computer with Node.js 20+ installed
- A GitHub account (for CI/CD)
- A credit/debit card (for AWS account — free tier covers this app)

## Part 1: AWS Account Setup

### 1.1 Create an AWS Account

1. Go to https://aws.amazon.com/ and click **Create an AWS Account**
2. Enter your email, choose an account name
3. Add payment method (you won't be charged — free tier covers this app)
4. Choose the **Basic (Free)** support plan
5. Sign in to the AWS Console: https://console.aws.amazon.com/

### 1.2 Install AWS CLI

**macOS:**
```bash
brew install awscli
```

**Windows:**
Download from https://aws.amazon.com/cli/

**Linux:**
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip && sudo ./aws/install
```

### 1.3 Create an IAM User for CLI Access

1. Go to https://console.aws.amazon.com/iam/
2. Click **Users** → **Create user**
3. Name: `hr-app-deployer`
4. Check **Provide user access to the AWS Management Console** (optional)
5. Click **Next**
6. Select **Attach policies directly**
7. Search and check: `AdministratorAccess` (for initial setup; you can restrict later)
8. Click **Create user**
9. On the user page, go to **Security credentials** tab
10. Click **Create access key** → **Command Line Interface (CLI)**
11. Copy the **Access Key ID** and **Secret Access Key**

### 1.4 Configure AWS CLI

```bash
aws configure
```

Enter:
- Access Key ID: *(from step 1.3)*
- Secret Access Key: *(from step 1.3)*
- Default region: `ap-northeast-1` (or your preferred region)
- Default output format: `json`

Verify:
```bash
aws sts get-caller-identity
```

You should see your account ID and user ARN.

## Part 2: App Setup

### 2.1 Clone and Install

```bash
git clone <repo-url>
cd hr-attendance-app
npm install
```

### 2.2 Run the Setup Wizard

```bash
npx hr-app init
```

Answer the prompts — this generates `config.yaml`.

### 2.3 Deploy

```bash
npx hr-app deploy
```

First deploy takes 5-10 minutes (creating all AWS resources). Subsequent deploys are faster.

### 2.4 Verify

```bash
npx hr-app status
```

All stacks should show `CREATE_COMPLETE`.

## Part 3: CI/CD Setup (GitHub Actions)

This automates deployment on every push to `main` or `develop`.

### 3.1 Create an OIDC Identity Provider in AWS

This lets GitHub Actions authenticate with AWS without storing long-lived secrets.

1. Go to https://console.aws.amazon.com/iam/ → **Identity providers** → **Add provider**
2. Provider type: **OpenID Connect**
3. Provider URL: `https://token.actions.githubusercontent.com`
4. Click **Get thumbprint**
5. Audience: `sts.amazonaws.com`
6. Click **Add provider**

### 3.2 Create an IAM Role for GitHub Actions

1. Go to **IAM** → **Roles** → **Create role**
2. Trusted entity type: **Web identity**
3. Identity provider: `token.actions.githubusercontent.com`
4. Audience: `sts.amazonaws.com`
5. Click **Next**
6. Attach policy: `AdministratorAccess` (or create a custom policy for CDK)
7. Click **Next**
8. Role name: `hr-app-github-actions`
9. Click **Create role**
10. Open the role → **Trust relationships** → **Edit trust policy**
11. Replace the `Condition` block with:

```json
{
  "Condition": {
    "StringLike": {
      "token.actions.githubusercontent.com:sub": "repo:YOUR_GITHUB_USERNAME/YOUR_REPO_NAME:*"
    }
  }
}
```

Replace `YOUR_GITHUB_USERNAME/YOUR_REPO_NAME` with your actual GitHub repository path (e.g., `acme-corp/hr-attendance-app`).

12. Click **Update policy**
13. Copy the **Role ARN** — it looks like: `arn:aws:iam::123456789012:role/hr-app-github-actions`

### 3.3 Add the Role ARN to GitHub Secrets

1. Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `AWS_ROLE_ARN`
4. Value: *(paste the Role ARN from step 3.2)*
5. Click **Add secret**

### 3.4 Create GitHub Environments

1. Go to **Settings** → **Environments**
2. Create environment: `dev`
3. Create environment: `production` (optionally add required reviewers for production deploys)

### 3.5 Push and Deploy

```bash
git push origin develop    # Triggers dev deployment
git push origin main       # Triggers production deployment
```

CI runs on every PR: lint, typecheck, tests, config validation.

## Cost Estimate

For a single-tenant deployment with <50 employees:

| Resource | Monthly Cost |
|----------|-------------|
| DynamoDB | $0 (free tier: 25 GB, 25 RCU/WCU) |
| Lambda | $0 (free tier: 1M requests/month) |
| API Gateway | $0 (free tier: 1M calls/month) |
| S3 + CloudFront | $0-1 (free tier: 5 GB, 50 GB transfer) |
| Cognito | $0 (free tier: 50,000 MAU) |
| SQS | $0 (free tier: 1M requests/month) |
| **Total** | **$0-5/month** |

## Troubleshooting

### "CDK bootstrap required"
Run once per AWS account/region:
```bash
npx cdk bootstrap aws://YOUR_ACCOUNT_ID/YOUR_REGION
```

### "Access denied"
Verify your AWS credentials: `aws sts get-caller-identity`

### "Stack already exists"
The stack from a previous deploy exists. Run `npx hr-app status` to check, or `npx hr-app destroy` to start fresh.

## Next Steps

- [Set up Slack](slack-app-setup.md) — Configure the Slack bot
- [Add first employee](first-employee.md) — Onboard your first employee
- [Customize branding](../guides/branding.md) — Change colors, name, logo
