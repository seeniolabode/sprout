import { ensureJiraConfig, loadConfig } from "../../config/loadConfig.js"
import { generateBranchName } from "../../domain/generateBranchName.js"
import { createBranch } from "../../git/gitClient.js"
import { fetchAssignedJiraTickets } from "../../jira/jiraClient.js"
import {
  confirmBranchCreation,
  editBranchName,
  selectIntent,
  selectTicket
} from "../prompts.js"
import { printBranchPreview, printSuccess } from "../output.js"

export async function runJiraCommand(): Promise<void> {
  const config = await loadConfig()
  const jiraConfig = ensureJiraConfig(config)

  const tickets = await fetchAssignedJiraTickets(jiraConfig)
  const ticket = await selectTicket(tickets)
  const intent = await selectIntent()

  const generatedBranch = generateBranchName({
    intent,
    issueKey: ticket.key,
    description: ticket.summary
  })

  printBranchPreview(generatedBranch)
  const branchName = await editBranchName(generatedBranch)

  const confirmed = await confirmBranchCreation(branchName)
  if (!confirmed) {
    return
  }

  await createBranch(branchName)
  printSuccess(branchName)
}
