export const BRANCH_INTENTS = [
  "feat",
  "fix",
  "hotfix",
  "release",
  "chore",
  "refactor",
  "test"
] as const

export type BranchIntent = (typeof BRANCH_INTENTS)[number]

export type JiraTicket = {
  key: string
  summary: string
}

export type BranchInput = {
  intent: BranchIntent
  description: string
  issueKey?: string
}
