export type JiraConfig = {
  baseUrl: string
  email: string
  apiToken: string
  jql?: string
  limit: number
  debug: boolean
  [key: string]: unknown
}

export type AppConfig = {
  jira: JiraConfig
  [key: string]: unknown
}
