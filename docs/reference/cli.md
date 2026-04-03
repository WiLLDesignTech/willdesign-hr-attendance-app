# CLI Reference

The `hr-app` CLI manages setup, deployment, and local development.

## Installation

The CLI is included in the monorepo. Run via `npx`:

```bash
npx hr-app <command>
```

Or after `npm install`:

```bash
npx hr-app <command>
```

## Commands

### `hr-app init`

Interactive setup wizard. Generates `config.yaml`.

```bash
npx hr-app init
```

Prompts for: company name, theme color, deployment mode, AWS region, accounting currency, custom domain, office regions, admin email.

### `hr-app deploy`

Deploy to AWS using CDK.

```bash
npx hr-app deploy [--stage dev|prod] [--dry-run]
```

| Option | Default | Description |
|--------|---------|-------------|
| `--stage` | `dev` | Deployment stage |
| `--dry-run` | false | Run CDK diff instead of deploy |

Prerequisites:
- `config.yaml` must exist (run `init` first)
- AWS credentials must be configured

### `hr-app destroy`

Tear down all AWS stacks.

```bash
npx hr-app destroy [--stage dev|prod] [--force]
```

| Option | Default | Description |
|--------|---------|-------------|
| `--stage` | `dev` | Which stage to destroy |
| `--force` | false | Skip confirmation prompt |

### `hr-app status`

Check CloudFormation stack health.

```bash
npx hr-app status [--stage dev|prod]
```

Shows status for all stacks: database, auth, api, slack, web, scheduler, email.

### `hr-app dev`

Start local development stack.

```bash
npx hr-app dev
```

Starts DynamoDB Local, API server, and Web dev server. Equivalent to `npm run dev`.

### `hr-app seed`

Load sample data into the database.

```bash
npx hr-app seed [--endpoint http://localhost:8000]
```

| Option | Default | Description |
|--------|---------|-------------|
| `--endpoint` | `http://localhost:8000` | DynamoDB endpoint |
