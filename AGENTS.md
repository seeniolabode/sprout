# agents.md — Sprout (AI Collaboration Guide)

This file defines how AI coding agents should collaborate on the **sprout** project.

Sprout is a CLI tool that creates git branches from Jira tickets assigned to the user or from manual input.

The purpose of this project is both **productivity** and **learning good engineering practices**.  
Agents must prioritize **clean architecture, testability, and small incremental progress**.

---

# Project Overview

Sprout is a CLI tool that helps developers create correctly formatted git branches from Jira tickets.

Two modes exist:

## Default (Jira mode)

Command:

sprout

Flow:

1. Fetch Jira issues assigned to the current user that are not done (limit 20)
2. Show interactive list of issues
3. User selects an issue
4. Ask user for branch intent
5. Generate branch name
6. Show preview and allow editing
7. Confirm
8. Create the branch

Git command used:

git checkout -b <branchName>

---

## Custom mode

Command:

sprout --custom

Flow:

1. Select branch intent
2. Enter description manually
3. Generate branch name
4. Show preview
5. Allow editing
6. Confirm
7. Create branch

---

# Branch Naming Rules

Branch intents:

feat  
fix  
hotfix  
release  
chore  
refactor  
test

Standard format:

<intent>/<ISSUEKEY>-<slug>

Example:

feat/MC-37-edit-flow

Rules:

- Jira mode must always include the Jira key
- Custom mode may omit the Jira key
- Slug must be lowercase
- Spaces become "-"
- Remove punctuation
- Collapse multiple "-"
- Trim leading/trailing "-"
- Maximum slug length: 50 characters

Example:

"Edit Flow (Admin UI)"

Becomes:

edit-flow-admin-ui

If slug becomes empty after cleaning:

- Prompt user for manual input
- Do not silently fallback

---

# Architecture Rules

The project must maintain strict separation between **domain logic** and **external systems**.

Directory structure:

src/
  cli/
  domain/
  jira/
  git/
  config/
  shared/

test/
  domain/

---

## Domain Layer

Location:

src/domain/

Responsibilities:

- Branch naming rules
- Slug generation
- Type definitions

Domain code must:

- be pure
- have no side effects
- not access network
- not access filesystem
- not run git
- not prompt users
- not read environment variables

Domain code must be fully testable.

---

## Jira Adapter

Location:

src/jira/

Responsibilities:

- Call Jira API
- Handle authentication
- Map Jira responses into internal types

Normalized Jira ticket type:

{
    key: string
    summary: string
}

---

## Git Adapter

Location:

src/git/

Responsibilities:

- Verify repository exists
- Verify branch does not exist
- Execute git commands

Branch creation command:

git checkout -b <branchName>

---

## CLI Layer

Location:

src/cli/

Responsibilities:

- CLI flags
- Interactive prompts
- Previewing branch names
- Confirming actions
- Calling adapters and domain logic

---

# Environment Configuration

Environment variables used:

JIRA_BASE_URL  
JIRA_EMAIL  
JIRA_API_TOKEN  

Optional:

JIRA_JQL  
JIRA_LIMIT  
SPROUT_DEBUG

Authentication uses Basic Auth with base64 encoding.

---

# Testing Requirements

Testing framework:

Vitest

Tests must exist for:

- slugify()
- generateBranchName()

Test cases must include:

- punctuation removal
- emoji removal
- multiple spaces
- very long descriptions
- empty descriptions
- correct branch formatting

Adapters do not require extensive testing in v1.

---

# Development Workflow

Agents must follow this development order:

1. Implement domain types
2. Write tests for domain logic
3. Implement domain functions
4. Implement Jira adapter
5. Implement Git adapter
6. Implement CLI flows

Do not implement all layers at once.

Make small incremental changes.

---

# Error Handling

Use structured application errors.

Examples:

CONFIG_MISSING  
JIRA_AUTH  
JIRA_HTTP  
JIRA_PARSE  
GIT_NOT_REPO  
GIT_BRANCH_EXISTS  
USER_CANCELLED  
INVALID_INPUT  

CLI should show concise error messages.

Debug mode may print additional details.

---

# CLI UX Rules

Minimize prompts.

Jira mode flow:

select issue → select intent → preview/edit → confirm

Custom mode flow:

select intent → description → preview/edit → confirm

Preview must allow inline editing before confirmation.

---

# Git Behavior

Before creating a branch:

Verify repository exists:

git rev-parse --is-inside-work-tree

Verify branch does not exist:

git show-ref --verify --quiet refs/heads/<branch>

Create branch:

git checkout -b <branch>

Sprout does NOT push branches in v1.

---

# Scope Guardrails

Do not implement these features in v1:

- automatic Jira transitions
- PR creation
- pushing branches
- caching Jira tickets
- clipboard detection
- branch type inference
- complex configuration systems

Focus on delivering a clean v1.

---

# Collaboration Rules for AI Agents

Agents must:

- make small incremental changes
- respect architecture boundaries
- explain reasoning before major changes
- avoid rewriting large sections of code
- prefer simple solutions that satisfy v1 requirements

If requirements are unclear, choose a reasonable default and document the decision.

---

# Current Development Focus

Start with the domain layer.

Implement:

src/domain/types.ts  
src/domain/slugify.ts  
src/domain/branchName.ts  

Add tests under:

test/domain/

Do not implement Jira or CLI until domain tests pass.