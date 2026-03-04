export const ERROR_CODES = {
  MISSING_ENV: "MISSING_ENV",
  AUTH_FAILED: "AUTH_FAILED",
  NETWORK_ERROR: "NETWORK_ERROR",
  INVALID_JIRA_RESPONSE: "INVALID_JIRA_RESPONSE",
  NO_TICKETS: "NO_TICKETS",
  JIRA_REQUEST_FAILED: "JIRA_REQUEST_FAILED",
  NOT_GIT_REPO: "NOT_GIT_REPO",
  BRANCH_EXISTS: "BRANCH_EXISTS",
  GIT_COMMAND_FAILED: "GIT_COMMAND_FAILED"
} as const

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]

export class SproutError extends Error {
  public readonly code: ErrorCode

  constructor(code: ErrorCode, message: string, options?: { cause?: unknown }) {
    super(message)
    this.name = "SproutError"
    this.code = code

    if (options?.cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = options.cause
    }
  }
}

export function createError(code: ErrorCode, message: string, cause?: unknown): SproutError {
  return new SproutError(code, message, cause === undefined ? undefined : { cause })
}
