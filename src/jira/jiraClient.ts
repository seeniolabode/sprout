import type { JiraTicket } from "../domain/types.js"
import { createError, ERROR_CODES } from "../shared/errors.js"
import { mapJiraSearchResponse } from "./jiraMapper.js"
import { buildJiraSearchParams, DEFAULT_JIRA_LIMIT } from "./jql.js"

type JiraConfig = {
  baseUrl: string
  email: string
  apiToken: string
  jql?: string
  limit: number
  debug: boolean
}

type JiraEnv = Record<string, string | undefined>

export async function fetchAssignedJiraTickets(env: JiraEnv = readRuntimeEnv()): Promise<JiraTicket[]> {
  const config = readJiraConfig(env)
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

function readJiraConfig(env: JiraEnv): JiraConfig {
  const missing: string[] = []

  const baseUrl = env.JIRA_BASE_URL?.trim() ?? ""
  const email = env.JIRA_EMAIL?.trim() ?? ""
  const apiToken = env.JIRA_API_TOKEN?.trim() ?? ""

  if (!baseUrl) missing.push("JIRA_BASE_URL")
  if (!email) missing.push("JIRA_EMAIL")
  if (!apiToken) missing.push("JIRA_API_TOKEN")

  if (missing.length > 0) {
    throw createError(
      ERROR_CODES.MISSING_ENV,
      `Missing required environment variable(s): ${missing.join(", ")}`
    )
  }

  const limit = parseLimit(env.JIRA_LIMIT)

  return {
    baseUrl,
    email,
    apiToken,
    jql: env.JIRA_JQL?.trim() || undefined,
    limit,
    debug:
      env.JIRA_DEBUG === "1" ||
      env.JIRA_DEBUG === "true" ||
      env.SPROUT_DEBUG === "1" ||
      env.SPROUT_DEBUG === "true"
  }
}

function normalizeBaseUrl(baseUrl: string): string {
  const normalized = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`

  try {
    return new URL(normalized).toString()
  } catch (error) {
    throw createError(ERROR_CODES.MISSING_ENV, "JIRA_BASE_URL is not a valid URL", error)
  }
}

function parseLimit(value: string | undefined): number {
  if (!value) {
    return DEFAULT_JIRA_LIMIT
  }

  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return DEFAULT_JIRA_LIMIT
  }

  return parsed
}

function encodeBasicAuth(email: string, token: string): string {
  return btoa(`${email}:${token}`)
}

function readRuntimeEnv(): JiraEnv {
  const runtime = globalThis as { process?: { env?: JiraEnv } }
  return runtime.process?.env ?? {}
}
