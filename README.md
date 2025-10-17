## Jira Automation Action

This repository hosts the implementation for an Action that sends a webhook to Jira whenever a branch receives a Pull Request merge.

### Contract

This action receives the following parameters:

- `pr_title`: Pull request title.
- `pr_description`: Pull request description.
- `pr_url`: Pull request URL.
- `branch`: PR base branch.
- `jira_webhook_url`: The webhook URL you get from Jira Automation rules.
- `jira_webhook_secret`: The webhook secret you get from Jira Automation rules.
- `jira_ticket_code_prefix`: The ticket code prefix you use. For example,`STC` for tickets like `STC-###`.

The webhook will be sent with the following payload, accesible on your automation:

```ts
{
    "data": {
        "branch": string,
        "pr_url": string,
      },
}
```

### How to setup

#### Jira

You will need to set up your automation in Jira in the following way:

- Create a new rule
- First step of the rule should be `When: Incoming webhook`. Save the webhook URL and the webhook secret that you will be given.

Afterwards, next steps in the automation are up to you. You can consult their docs to see the available options, but one of the most important concepts is accessing the webhook data by using their templates, like `{{webhookData.branch}}`. There are more, like `{{issue.key}}`. An example of how that looks like in an Edit work item rule:

```json
{
  "update": {
    "comment": [
      {
        "add": {
          "body": "{{issue.key}} merged to {{webhookData.branch}} on {{now.convertToTimeZone('America/Chicago').format('yyyy-MM-dd HH:mm:ss')}} (Central Time) or {{now.convertToTimeZone('America/Argentina/Buenos_Aires').format('yyyy-MM-dd HH:mm:ss')}} (ARG) through pull request {{webhookData.pr_url}}"
        }
      }
    ]
  }
}
```

You will probably want to make `If: matches` conditions to send tickets to different statuses depending on the merged branch, for example. Then you can do comparisons like "`{{webhookData.branch}}` equals `dev`".

#### Repository

Include this action in your `.github/workflows` folder. You can consult the docs, but here is an example of how the .yml file should look like:

```yml
name: Jira automation

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
    if: github.event.pull_request.merged == true &&
      !(
      (github.event.pull_request.head.ref == 'qa-helper' && github.event.pull_request.base.ref == 'dev') ||
      (github.event.pull_request.head.ref == 'main-helper' && github.event.pull_request.base.ref == 'qa')
      )
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
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

Some things worth mentioning from this snippet:

- this action only triggers for the pipeline branches ("main", "qa" and "dev").
- It also omits acting if the Pull Request was closed but not merged.
- It also reads the webhook URL and webhook secret from our repository secrets.