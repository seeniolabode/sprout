# Sprout — Jira Branching CLI

Sprout is a CLI tool that helps developers quickly create Git branches from Jira tickets with consistent naming conventions.

## Overview

Sprout speeds up day-to-day branching by combining Jira ticket selection with automatic branch name generation.

It helps you:
- create branches faster
- keep branch names consistent across teams
- work directly from assigned Jira tickets
- use the same workflow in any Git repository

## Installation

### Global install (recommended)

```bash
npm install -g sprout
```

### Local development install

From this repository:

```bash
npm install
npm run build
npm link
```

After linking, `sprout` is available in your shell.

## Initial Setup

Run:

```bash
sprout init
```

This command:
- detects your global Sprout config location
- prompts for Jira credentials and defaults
- creates the global config file for reuse across repositories

Global config file location:
- macOS/Linux: `~/.config/sprout/config.json`
- Windows: `%APPDATA%/sprout/config.json`

## Usage

### Create a branch from a Jira ticket

```bash
sprout
```

Workflow:
1. Sprout fetches your assigned Jira tickets
2. You select a ticket
3. You choose branch intent (`feat`, `fix`, `hotfix`, etc.)
4. Sprout generates a branch name
5. You can edit the generated branch name
6. You confirm
7. Sprout runs `git checkout -b <branch>`

Example output branch:

```text
feat/MC-37-edit-flow
```

### Create a custom branch (without Jira ticket selection)

```bash
sprout --custom
```

Use this when you want branch generation without Jira ticket picking.

## Configuration

Sprout merges config sources in this order (highest to lowest):
1. Environment variables
2. Project config file: `.sproutrc.json` (current working directory)
3. Global config file: `~/.config/sprout/config.json` (or OS equivalent)
4. Built-in defaults

### Example config file

```json
{
  "jira": {
    "baseUrl": "https://company.atlassian.net",
    "email": "you@company.com",
    "apiToken": "your_api_token",
    "limit": 20,
    "jql": "assignee = currentUser() AND statusCategory != Done ORDER BY updated DESC",
    "debug": false
  }
}
```

Field reference:
- `jira.baseUrl`: Jira site base URL
- `jira.email`: Jira account email
- `jira.apiToken`: Jira API token
- `jira.limit`: max number of tickets to fetch
- `jira.jql` (optional): custom Jira query
- `jira.debug`: enable verbose Jira adapter logging

## Environment Variables

Environment variables override file-based config.

Example:

```bash
JIRA_API_TOKEN=abc sprout
```

Supported variables:
- `JIRA_BASE_URL`
- `JIRA_EMAIL`
- `JIRA_API_TOKEN`
- `JIRA_JQL`
- `JIRA_LIMIT`
- `JIRA_DEBUG`

## Examples

### Create a feature branch from Jira

```bash
sprout
```

### Create a hotfix branch manually

```bash
sprout --custom
```

Choose `hotfix` when prompted, enter description, review branch preview, and confirm.

## Troubleshooting

### Permission denied when running `sprout`

Try reinstalling or relinking:

```bash
npm uninstall -g sprout
npm install -g sprout
```

If using local development install:

```bash
npm run build
npm link
```

### Missing configuration

If you see a config error, run:

```bash
sprout init
```

### Jira authentication errors

If authentication fails:
- verify `JIRA_EMAIL` matches your Jira account
- regenerate Jira API token in Atlassian account settings
- update your global config or environment variable values
