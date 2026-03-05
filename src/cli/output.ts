import ora from "ora"

import { ERROR_CODES } from "../shared/errors.js"

export function printBranchPreview(branchName: string): void {
  console.log("")
  console.log(`Branch preview: ${branchName}`)
  console.log("")
}

export function printSuccess(message: string): void {
  console.log(`✔ ${message}`)
}

export function printWarning(message: string): void {
  console.log(`⚠ ${message}`)
}

export async function withSpinner<T>(
  loadingText: string,
  task: () => Promise<T>,
  successText: string
): Promise<T> {
  const spinner = ora(loadingText).start()

  try {
    const result = await task()
    spinner.succeed(successText)
    return result
  } catch (error) {
    spinner.stop()
    throw error
  }
}

export function printError(error: unknown, debug: boolean): void {
  const message = toUserMessage(error)
  const prefix = isWarningCode(readErrorCode(error)) ? "⚠" : "✖"
  console.error(`${prefix} ${message}`)

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
    case ERROR_CODES.CONFIG_NOT_FOUND:
      return "Sprout configuration not found. Run `sprout init` to set up your Jira credentials."
    case ERROR_CODES.MISSING_ENV:
      return "Missing required Jira configuration."
    case ERROR_CODES.AUTH_FAILED:
      return "Jira authentication failed. Check your credentials or run `sprout init`."
    case ERROR_CODES.NETWORK_ERROR:
      return "Could not connect to Jira."
    case ERROR_CODES.INVALID_JIRA_RESPONSE:
      return "Unexpected response from Jira."
    case ERROR_CODES.NO_TICKETS:
      return "No Jira tickets assigned to you."
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

function isWarningCode(code: string | undefined): boolean {
  return code === ERROR_CODES.NO_TICKETS
}

function readErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") {
    return undefined
  }

  const candidate = error as { code?: unknown }

  return typeof candidate.code === "string" ? candidate.code : undefined
}
