import { generateBranchName } from "../../domain/generateBranchName"
import { createBranch } from "../../git/gitClient"
import { fetchAssignedJiraTickets } from "../../jira/jiraClient"
import {
  confirmBranchCreation,
  editBranchName,
  selectIntent,
  selectTicket
} from "../prompts"
import { printBranchPreview, printSuccess } from "../output"

export async function runJiraCommand(): Promise<void> {
  const tickets = await fetchAssignedJiraTickets()
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
