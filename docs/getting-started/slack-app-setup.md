# Slack App Setup

The HR Attendance App uses Slack as the primary interface for daily attendance and reporting.

## Step 1: Create a Slack App

1. Go to https://api.slack.com/apps
2. Click **Create New App** → **From scratch**
3. Name: your company name (e.g., "Acme HR Bot")
4. Workspace: select your Slack workspace

## Step 2: Configure Bot Permissions

Under **OAuth & Permissions** → **Bot Token Scopes**, add:

| Scope | Purpose |
|-------|---------|
| `chat:write` | Send attendance confirmations |
| `channels:history` | Read messages in attendance channels |
| `channels:read` | List channels for configuration |
| `users:read` | Look up user profiles |
| `im:history` | Read direct messages (for commands) |
| `im:write` | Send DMs (for reminders) |

## Step 3: Enable Events

Under **Event Subscriptions**:
1. Enable events
2. Set Request URL: `https://<your-api-url>/api/slack/events`
3. Subscribe to bot events:
   - `message.channels` — attendance messages in channels
   - `message.im` — direct message commands

## Step 4: Install to Workspace

1. Go to **Install App**
2. Click **Install to Workspace**
3. Copy the **Bot User OAuth Token** (starts with `xoxb-`)

## Step 5: Store Secrets

Store Slack credentials in AWS SSM Parameter Store (never in config.yaml):

```bash
aws ssm put-parameter --name "/hr-app/slack/bot-token" --value "xoxb-..." --type SecureString
aws ssm put-parameter --name "/hr-app/slack/signing-secret" --value "..." --type SecureString
```

## Step 6: Configure Channels

In Slack, create channels for attendance and reporting:
- `#attendance` — clock in/out messages
- `#daily-reports` — daily work reports

The bot will auto-detect channel purposes based on configuration.

## How It Works

1. Employee types "hello" in `#attendance` → bot records clock-in, confirms
2. Employee types "break" → bot records break start
3. Employee types "bye" → bot records clock-out, shows daily summary
4. Employee posts in `#daily-reports` → bot extracts JIRA/GitHub references, saves report

### Supported Keywords

| Action | English | Japanese |
|--------|---------|----------|
| Clock in | hello, hi, good morning | おはよう, 出勤 |
| Break | break, brb | 休憩 |
| Back | back, i'm back | 戻り |
| Clock out | bye, goodbye | おつかれ, 退勤 |
| Help | help | ヘルプ |
| Language | lang en, lang ja | 言語 en |
