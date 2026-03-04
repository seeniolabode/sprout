import { ERROR_CODES } from "../shared/errors"

export function printBranchPreview(branchName: string): void {
  console.log(`Branch preview: ${branchName}`)
}

export function printSuccess(branchName: string): void {
  console.log(`Created branch: ${branchName}`)
}

export function printError(error: unknown, debug: boolean): void {
  const message = toUserMessage(error)
  console.error(message)

  if (debug && error instanceof Error && error.stack) {
    console.error(error.stack)
  }
}

export function isCancelledError(error: unknown): boolean {
  return readErrorCode(error) === ERROR_CODES.USER_CANCELLED
}

function toUserMessage(error: unknown): string {
  const code = readErrorCode(error)

  switch (code) {
    case ERROR_CODES.USER_CANCELLED:
      return "Cancelled."
    case ERROR_CODES.MISSING_ENV:
      return "Missing required Jira configuration."
    case ERROR_CODES.AUTH_FAILED:
      return "Jira authentication failed. Check Jira credentials."
    case ERROR_CODES.NETWORK_ERROR:
      return "Could not connect to Jira."
    case ERROR_CODES.INVALID_JIRA_RESPONSE:
      return "Unexpected response from Jira."
    case ERROR_CODES.NO_TICKETS:
      return "No assigned Jira tickets found."
    case ERROR_CODES.JIRA_REQUEST_FAILED:
      return "Jira request failed."
    case ERROR_CODES.NOT_GIT_REPO:
      return "Current directory is not a git repository."
    case ERROR_CODES.BRANCH_EXISTS:
      return "Branch already exists."
    case ERROR_CODES.GIT_COMMAND_FAILED:
      return "Git command failed."
    default:
      if (error instanceof Error && error.message.trim().length > 0) {
        return error.message
      }

      return "Something went wrong."
  }
}

function readErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") {
    return undefined
  }

  const candidate = error as { code?: unknown }

  return typeof candidate.code === "string" ? candidate.code : undefined
}
