import { generateBranchName } from "../../domain/generateBranchName"
import { createBranch } from "../../git/gitClient"
import { confirmBranchCreation, editBranchName, inputDescription, selectIntent } from "../prompts"
import { printBranchPreview, printSuccess } from "../output"

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

  await createBranch(branchName)
  printSuccess(branchName)
}
