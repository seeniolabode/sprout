import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { fetchAssignedJiraTickets } from "../../src/jira/jiraClient"
import { ERROR_CODES, type SproutError } from "../../src/shared/errors"

function createEnv(overrides: Record<string, string | undefined> = {}): Record<string, string | undefined> {
  return {
    JIRA_BASE_URL: "https://acme.atlassian.net",
    JIRA_EMAIL: "dev@acme.com",
    JIRA_API_TOKEN: "secret-token",
    ...overrides
  }
}

function mockJsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body)
  } as unknown as Response
}

describe("fetchAssignedJiraTickets", () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it("fetches assigned tickets and normalizes output", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      mockJsonResponse(200, {
        issues: [{ key: "MC-37", fields: { summary: "Edit Flow" } }]
      })
    )

    globalThis.fetch = fetchMock as unknown as typeof fetch

    const tickets = await fetchAssignedJiraTickets(createEnv())

    expect(tickets).toEqual([{ key: "MC-37", summary: "Edit Flow" }])

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit]

    expect(url.toString()).toContain("/rest/api/3/search/jql?")
    expect(url.searchParams.get("jql")).toBe(
      "assignee = currentUser() AND statusCategory != Done ORDER BY updated DESC"
    )
    expect(url.searchParams.get("maxResults")).toBe("20")
    expect(url.searchParams.get("fields")).toBe("summary")

    expect(init.method).toBe("GET")
    expect(init.headers).toMatchObject({
      Accept: "application/json",
      Authorization: `Basic ${btoa("dev@acme.com:secret-token")}`
    })
  })

  it("throws for missing required env vars", async () => {
    await expect(fetchAssignedJiraTickets(createEnv({ JIRA_API_TOKEN: "" }))).rejects.toMatchObject({
      code: ERROR_CODES.MISSING_ENV
    })
  })

  it("throws authentication error on 401/403", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(mockJsonResponse(401, {})) as unknown as typeof fetch

    await expect(fetchAssignedJiraTickets(createEnv())).rejects.toMatchObject({
      code: ERROR_CODES.AUTH_FAILED
    })
  })

  it("throws network error when fetch fails", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("socket hang up")) as unknown as typeof fetch

    await expect(fetchAssignedJiraTickets(createEnv())).rejects.toMatchObject({
      code: ERROR_CODES.NETWORK_ERROR
    })
  })

  it("throws invalid response error when body is not json", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200, json: vi.fn().mockRejectedValue(new Error("bad json")) }) as unknown as typeof fetch

    await expect(fetchAssignedJiraTickets(createEnv())).rejects.toMatchObject({
      code: ERROR_CODES.INVALID_JIRA_RESPONSE
    })
  })

  it("throws invalid response error when issues shape is invalid", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(mockJsonResponse(200, { issues: "not-an-array" })) as unknown as typeof fetch

    await expect(fetchAssignedJiraTickets(createEnv())).rejects.toMatchObject({
      code: ERROR_CODES.INVALID_JIRA_RESPONSE
    })
  })

  it("throws no tickets error when Jira returns no issues", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(mockJsonResponse(200, { issues: [] })) as unknown as typeof fetch

    await expect(fetchAssignedJiraTickets(createEnv())).rejects.toMatchObject({
      code: ERROR_CODES.NO_TICKETS
    })
  })

  it("throws request failed for non-ok non-auth status", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(mockJsonResponse(500, { error: "boom" })) as unknown as typeof fetch

    await expect(fetchAssignedJiraTickets(createEnv())).rejects.toMatchObject({
      code: ERROR_CODES.JIRA_REQUEST_FAILED
    })
  })

  it("logs request and ticket count when debug is enabled", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined)

    const fetchMock = vi.fn().mockResolvedValue(
      mockJsonResponse(200, {
        issues: [{ key: "MC-37", fields: { summary: "Edit Flow" } }]
      })
    )

    globalThis.fetch = fetchMock as unknown as typeof fetch

    await fetchAssignedJiraTickets(createEnv({ JIRA_DEBUG: "true" }))

    expect(logSpy).toHaveBeenCalledTimes(2)
    expect(logSpy.mock.calls[0]?.[0]).toContain("[sprout:jira] GET")
    expect(logSpy.mock.calls[1]?.[0]).toContain("[sprout:jira] Received 1 ticket(s)")
  })

  it("uses default limit when JIRA_LIMIT is invalid", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      mockJsonResponse(200, {
        issues: [{ key: "MC-37", fields: { summary: "Edit Flow" } }]
      })
    )
    globalThis.fetch = fetchMock as unknown as typeof fetch

    await fetchAssignedJiraTickets(createEnv({ JIRA_LIMIT: "0" }))

    const [url] = fetchMock.mock.calls[0] as [URL]
    expect(url.searchParams.get("maxResults")).toBe("20")
  })

  it("throws SproutError with MISSING_ENV for invalid base URL", async () => {
    await expect(fetchAssignedJiraTickets(createEnv({ JIRA_BASE_URL: "not-a-url" }))).rejects.toMatchObject({
      code: ERROR_CODES.MISSING_ENV
    } satisfies Partial<SproutError>)
  })
})
