export const DEFAULT_JIRA_JQL =
  "assignee = currentUser() AND statusCategory != Done ORDER BY updated DESC"

export const DEFAULT_JIRA_LIMIT = 20
export const DEFAULT_JIRA_FIELDS = ["summary"] as const

export function buildJiraSearchParams(options?: {
  jql?: string
  limit?: number
  fields?: readonly string[]
}): URLSearchParams {
  const jql = options?.jql ?? DEFAULT_JIRA_JQL
  const limit = options?.limit ?? DEFAULT_JIRA_LIMIT
  const fields = options?.fields ?? DEFAULT_JIRA_FIELDS

  const params = new URLSearchParams()
  params.set("jql", jql)
  params.set("maxResults", String(limit))
  params.set("fields", fields.join(","))

  return params
}
