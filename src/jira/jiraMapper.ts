import { type JiraTicket } from "../domain/types"
import { ERROR_CODES, createError } from "../shared/errors"

type JiraIssue = {
  key?: unknown
  fields?: {
    summary?: unknown
  }
}

type JiraSearchResponse = {
  issues?: unknown
}

export function mapJiraSearchResponse(input: unknown): JiraTicket[] {
  const response = input as JiraSearchResponse

  if (!response || !Array.isArray(response.issues)) {
    throw createError(
      ERROR_CODES.INVALID_JIRA_RESPONSE,
      "Invalid Jira response: expected an issues array"
    )
  }

  return response.issues.map((issue, index) => mapJiraIssue(issue as JiraIssue, index))
}

function mapJiraIssue(issue: JiraIssue, index: number): JiraTicket {
  if (typeof issue.key !== "string" || issue.key.trim() === "") {
    throw createError(
      ERROR_CODES.INVALID_JIRA_RESPONSE,
      `Invalid Jira response: issue at index ${index} has no valid key`
    )
  }

  const summary = issue.fields?.summary
  if (typeof summary !== "string" || summary.trim() === "") {
    throw createError(
      ERROR_CODES.INVALID_JIRA_RESPONSE,
      `Invalid Jira response: issue ${issue.key} has no valid summary`
    )
  }

  return {
    key: issue.key,
    summary
  }
}
