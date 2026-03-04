import { describe, expect, it } from "vitest"

import { DEFAULT_JIRA_JQL, buildJiraSearchParams } from "../../src/jira/jql"

describe("buildJiraSearchParams", () => {
  it("builds default Jira search params", () => {
    const params = buildJiraSearchParams()

    expect(params.get("jql")).toBe(DEFAULT_JIRA_JQL)
    expect(params.get("maxResults")).toBe("20")
    expect(params.get("fields")).toBe("summary")
  })

  it("supports overriding jql, limit, and fields", () => {
    const params = buildJiraSearchParams({
      jql: "project = MC ORDER BY updated DESC",
      limit: 5,
      fields: ["summary", "status"]
    })

    expect(params.get("jql")).toBe("project = MC ORDER BY updated DESC")
    expect(params.get("maxResults")).toBe("5")
    expect(params.get("fields")).toBe("summary,status")
  })
})
