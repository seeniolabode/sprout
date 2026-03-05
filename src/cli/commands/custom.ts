import { generateBranchName } from "../../domain/generateBranchName.js"
import { createBranch } from "../../git/gitClient.js"
import { confirmBranchCreation, editBranchName, inputDescription, selectIntent } from "../prompts.js"
import { printBranchPreview, withSpinner } from "../output.js"

export async function runCustomCommand(): Promise<void> {
  const intent = await selectIntent()
  const description = await inputDescription(intent)

  const generatedBranch = generateBranchName({
    intent,
    description
  })

  printBranchPreview(generatedBranch)
  const branchName = await editBranchName(generatedBranch)

  const confirmed = await confirmBranchCreation(branchName)
  if (!confirmed) {
    return
  }

  await withSpinner(
    `Creating branch ${branchName}...`,
    async () => createBranch(branchName),
    `Created branch ${branchName}`
  )
}
