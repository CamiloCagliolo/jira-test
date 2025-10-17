import { getInput, setFailed, info } from "@actions/core";

/**
 * Normally one of "dev", "qa" or "main", at least in STC.
 */
type Branch = string;

type PullRequest = {
  title: string;
  description: string;
  branch: Branch;
  prUrl: string;
};

type SendWebhookProps = {
  webhook: { url: string; secret: string };
  tickets: string[];
  pr: PullRequest;
};

async function JiraAutomation() {
  try {
    const pr = {
      title: getInput("pr_title"),
      description: getInput("pr_description"),
      branch: getInput("branch") as Branch, // The branch the PR was merged into.
      prUrl: getInput("pr_url"),
    };

    const webhook = {
      url: getInput("jira_webhook_url"),
      secret: getInput("jira_webhook_secret"),
    } as const;

    const ticketPrefix = getInput("jira_ticket_code_prefix");

    const tickets = obtainTicketList({
      title: pr.title,
      description: pr.description,
      ticketPrefix,
    });

    if (!tickets.length) {
      // No tickets to notify Jira about. This could happen if it's a NO_TICKET PR
      info(
        "No tickets found in the PR title or description. Skipping Jira notification."
      );
      return;
    }

    info(
      `Notifying Jira that these tickets are being merged to ${
        pr.branch
      }: ${tickets.join(", ")}`
    );

    await sendWebhook({ webhook, tickets, pr });

    info(`Successfully notified Jira.`);
  } catch (error) {
    if (error instanceof Error) {
      setFailed(error.message);
    }
  }
}

function obtainTicketList({
  title,
  description,
  ticketPrefix,
}: Pick<PullRequest, "title" | "description"> & { ticketPrefix: string }): string[] {
  const ticketCodeRegex = new RegExp(`(${ticketPrefix}-\\d+)`, 'g');
  const ticketTitleMatch = title.match(ticketCodeRegex);

  if (ticketTitleMatch) {
    // Case 1: PR is for a single feature, single ticket, and it is in the title (enforced by other actions)
    return ticketTitleMatch;
  }

  // Case 2: PR is for a pipeline push, multiple features, multiple tickets, and they are in the description
  const ticketDescriptionMatch = description.match(ticketCodeRegex);

  /*
  An example of a PR description that contains ticket codes is shown below:
    This pipeline push includes the following changes:
    - [PREFIX-123 - Fix the bug in the login page](https://github.com/owner/repo/pull/323)
    - [PREFIX-124 - Add a new feature to the dashboard](https://github.com/owner/repo/pull/324)
    - [NO_TICKET - Update the footer component](https://github.com/owner/repo/pull/330)
    - [PREFIX-125 - Improve performance of the data processing module](https://github.com/owner/repo/pull/325)
    - [PREFIX-126 - Update the user profile page layout](https://github.com/owner/repo/pull/326)
    - [NO_TICKET - Update README documentation](https://github.com/owner/repo/pull/331)
    - [PREFIX-127 - Refactor the authentication service](https://github.com/owner/repo/pull/327)
    - [PREFIX-128 - Enhance security for API endpoints](https://github.com/owner/repo/pull/328)
    - [PREFIX-129 - Fix the issue with the notification system](https://github.com/owner/repo/pull/329)
    - [NO_TICKET - Refactor codebase for better readability](https://github.com/owner/repo/pull/332)

    Where PREFIX would be replaced by your actual ticket prefix (e.g., STC, PROJ, etc.)
 */

  return ticketDescriptionMatch ?? [];
}

async function sendWebhook({ webhook, tickets, pr }: SendWebhookProps) {
  const response = await fetch(webhook.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Automation-Webhook-Token": webhook.secret,
    },
    mode: "no-cors",
    body: JSON.stringify({
      issues: tickets,
      data: {
        branch: pr.branch,
        pr_url: pr.prUrl,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to notify Jira. HTTP status: ${response.status}`);
  }
}

export default JiraAutomation;
