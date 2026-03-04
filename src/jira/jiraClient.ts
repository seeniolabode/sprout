import type { JiraConfig } from "../config/types.js"
import type { JiraTicket } from "../domain/types.js"
import { createError, ERROR_CODES } from "../shared/errors.js"
import { mapJiraSearchResponse } from "./jiraMapper.js"
import { buildJiraSearchParams } from "./jql.js"

export async function fetchAssignedJiraTickets(config: JiraConfig): Promise<JiraTicket[]> {
  const url = new URL("/rest/api/3/search/jql", normalizeBaseUrl(config.baseUrl))

  url.search = buildJiraSearchParams({
    jql: config.jql,
    limit: config.limit
  }).toString()

  if (config.debug) {
    console.log(`[sprout:jira] GET ${url.toString()}`)
  }

  let response: Response
  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Basic ${encodeBasicAuth(config.email, config.apiToken)}`,
        Accept: "application/json"
      }
    })
  } catch (error) {
    throw createError(ERROR_CODES.NETWORK_ERROR, "Failed to reach Jira API", error)
  }

  if (response.status === 401 || response.status === 403) {
    throw createError(ERROR_CODES.AUTH_FAILED, "Jira authentication failed")
  }

  if (!response.ok) {
    throw createError(
      ERROR_CODES.JIRA_REQUEST_FAILED,
      `Jira request failed with status ${response.status}`
    )
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch (error) {
    throw createError(ERROR_CODES.INVALID_JIRA_RESPONSE, "Jira returned non-JSON response", error)
  }

  const tickets = mapJiraSearchResponse(payload)

  if (tickets.length === 0) {
    throw createError(ERROR_CODES.NO_TICKETS, "No assigned Jira tickets found")
  }

  if (config.debug) {
    console.log(`[sprout:jira] Received ${tickets.length} ticket(s)`)
  }

  return tickets
}

function normalizeBaseUrl(baseUrl: string): string {
  const normalized = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`

  try {
    return new URL(normalized).toString()
  } catch (error) {
    throw createError(ERROR_CODES.MISSING_ENV, "JIRA_BASE_URL is not a valid URL", error)
  }
}

function encodeBasicAuth(email: string, token: string): string {
  return btoa(`${email}:${token}`)
}
