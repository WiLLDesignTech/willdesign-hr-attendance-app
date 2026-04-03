# Branding Guide

Customize the app's appearance by editing `config.yaml`.

## Configuration

```yaml
app:
  appName: "Acme Corp HR"        # Full name (header, emails, PWA)
  appShortName: "Acme HR"        # Short name (mobile home screen)
  themeColor: "#2563EB"          # Primary brand color (hex)
  # logo: "./assets/logo.png"    # Logo path (optional)
```

## What Changes

| Element | Source |
|---------|--------|
| App header title | `appName` |
| PWA manifest name | `appName` / `appShortName` |
| Browser tab title | `appName` |
| Salary statement header | `salaryStatementTitle` |
| Salary statement footer | `salaryStatementFooter` |
| Theme accent color | `themeColor` |
| Slack bot display name | `appName` |

## Theme Customization

The theme is defined in `packages/web/src/theme/theme.ts`. The `themeColor` from config maps to the accent color. To customize further:

- **Colors**: Edit `theme.colors` (primary, accent, semantic colors)
- **Typography**: Edit `theme.fonts` (heading, body, mono)
- **Spacing**: Edit `theme.space` (xs through xxl)

## Email Templates

Salary statement emails use `AppBranding` values. To customize:
- `salaryStatementTitle` — header text on the PDF/email
- `salaryStatementFooter` — disclaimer text at the bottom

## Rebuilding After Changes

After editing `config.yaml`:

```bash
npm run build    # Rebuild with new branding
npx hr-app deploy  # Redeploy to AWS
```

For local development, `npm run dev` picks up changes automatically.
