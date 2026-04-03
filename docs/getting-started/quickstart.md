# Quickstart — Local Development in 5 Minutes

## Prerequisites

- Node.js 20+
- Docker (for DynamoDB Local)

## Steps

### 1. Clone and Install

```bash
git clone <repo-url>
cd hr-attendance-app
npm install
```

### 2. Start the Local Stack

```bash
npm run dev
```

This starts three services:
- **DynamoDB Local** on port 8000
- **API Server** (Express dev mode) on port 3001
- **Web App** (Vite) on port 5173

The setup script automatically creates the DynamoDB table and loads seed data on first run.

### 3. Open the App

Navigate to http://localhost:5173

Log in using the dev auth panel (no Cognito needed locally). Select any seed employee.

### Alternative: Docker Compose

If you prefer Docker for everything:

```bash
docker compose up
```

Same result — all three services start automatically.

## What's Included in Seed Data

- 4 sample employees (2 JP, 2 NP regions)
- Sample attendance events
- Japanese holidays for the current year
- Policy configurations for all employment types

## Next Steps

- [Deploy to AWS](deployment.md) — Full deployment walkthrough
- [Set up Slack](slack-app-setup.md) — Configure the Slack bot
- [Customize branding](../guides/branding.md) — Change app name, colors, logo
