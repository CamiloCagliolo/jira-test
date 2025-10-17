# Jira Automation Action

A GitHub Action that automatically sends webhooks to Jira when pull requests are merged, enabling seamless integration between your GitHub workflow and Jira project management.

## Features

- 🔄 Automatically detects Jira ticket codes in PR titles and descriptions
- 🎯 Configurable ticket prefix (e.g., STC, PROJ, TEAM)
- 🔐 Secure webhook authentication with secret tokens
- 📝 Supports both single-ticket PRs and multi-ticket pipeline merges
- 🌿 Branch-aware notifications (dev, qa, main)

## Usage

Add this action to your workflow file (e.g., `.github/workflows/jira-automation.yml`):

```yaml
name: Jira Automation

on:
  pull_request:
    types: [closed]
    branches:
      - main
      - qa
      - dev

jobs:
  jira_automation:
    runs-on: ubuntu-latest
    name: Notify Jira
    if: github.event.pull_request.merged == true
    steps:
      - name: Notify Jira
        uses: your-org/jira-automation-action@v1
        with:
          pr_title: ${{ github.event.pull_request.title }}
          pr_description: ${{ github.event.pull_request.body }}
          pr_url: ${{ github.event.pull_request.html_url }}
          branch: ${{ github.event.pull_request.base.ref }}
          jira_webhook_url: ${{ secrets.JIRA_WEBHOOK_URL }}
          jira_webhook_secret: ${{ secrets.JIRA_WEBHOOK_SECRET }}
          jira_ticket_code_prefix: STC
```

## Inputs

| Input | Description | Required | Example |
|-------|-------------|----------|---------|
| `pr_title` | The title of the pull request | Yes | `STC-123 - Fix login bug` |
| `pr_description` | The description/body of the pull request | Yes | `Fixes authentication issue...` |
| `pr_url` | The URL of the pull request | Yes | `https://github.com/owner/repo/pull/123` |
| `branch` | The base branch of the pull request | Yes | `main`, `qa`, `dev` |
| `jira_webhook_url` | The webhook URL from Jira Automation | Yes | `https://automation.atlassian.com/...` |
| `jira_webhook_secret` | The webhook secret from Jira Automation | Yes | `your-secret-token` |
| `jira_ticket_code_prefix` | Your Jira project prefix | Yes | `STC`, `PROJ`, `TEAM` |

## Webhook Payload

The action sends the following payload to your Jira webhook:

```json
{
  "issues": ["STC-123", "STC-124"],
  "data": {
    "branch": "main",
    "pr_url": "https://github.com/owner/repo/pull/123"
  }
}
```

## Jira Setup

1. **Create a Jira Automation Rule:**
   - Go to your Jira project settings
   - Navigate to Automation rules
   - Create a new rule with trigger: "Incoming webhook"
   - Save the webhook URL and secret token

2. **Configure Repository Secrets:**
   ```
   JIRA_WEBHOOK_URL=https://automation.atlassian.com/pro/hooks/...
   JIRA_WEBHOOK_SECRET=your-webhook-secret
   ```

3. **Example Jira Automation Actions:**
   - **Transition tickets**: Move tickets to "In Review" → "Done"
   - **Add comments**: `{{issue.key}} merged to {{webhookData.branch}} via {{webhookData.pr_url}}`
   - **Branch-specific logic**: Different actions for dev/qa/main branches

## Ticket Detection

The action supports two modes:

### Single Ticket PRs
Ticket code in the PR title:
```
STC-123 - Fix authentication bug
```

### Multi-Ticket Pipeline PRs
Ticket codes in the PR description:
```markdown
This pipeline push includes:
- [STC-123 - Fix login bug](https://github.com/owner/repo/pull/100)
- [STC-124 - Add new feature](https://github.com/owner/repo/pull/101)
- [NO_TICKET - Update docs](https://github.com/owner/repo/pull/102)
```

## Development

To modify or extend this action:

1. **Clone and install dependencies:**
   ```bash
   git clone https://github.com/your-org/jira-automation-action
   cd jira-automation-action
   npm install
   ```

2. **Build the action:**
   ```bash
   npm run build
   ```

3. **Test locally** (after making changes, commit the updated `dist/index.js`)

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Build and commit the `dist/index.js`
5. Submit a pull request