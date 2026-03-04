import { describe, expect, it } from "vitest"

import { mapJiraSearchResponse } from "../../src/jira/jiraMapper"
import { ERROR_CODES, SproutError } from "../../src/shared/errors"

describe("mapJiraSearchResponse", () => {
  it("maps Jira issues into normalized tickets", () => {
    const tickets = mapJiraSearchResponse({
      issues: [
        { key: "MC-37", fields: { summary: "Edit Flow" } },
        { key: "MC-38", fields: { summary: "Fix checkout" } }
      ]
    })

    expect(tickets).toEqual([
      { key: "MC-37", summary: "Edit Flow" },
      { key: "MC-38", summary: "Fix checkout" }
    ])
  })

  it("throws when issues array is missing", () => {
    expect(() => mapJiraSearchResponse({})).toThrowError(SproutError)

    try {
      mapJiraSearchResponse({})
    } catch (error) {
      expect((error as SproutError).code).toBe(ERROR_CODES.INVALID_JIRA_RESPONSE)
    }
  })

  it("throws when issue key is invalid", () => {
    expect(() =>
      mapJiraSearchResponse({
        issues: [{ key: "", fields: { summary: "Edit Flow" } }]
      })
    ).toThrowError(SproutError)
  })

  it("throws when issue summary is invalid", () => {
    expect(() =>
      mapJiraSearchResponse({
        issues: [{ key: "MC-37", fields: { summary: "" } }]
      })
    ).toThrowError(SproutError)
  })
})
