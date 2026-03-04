import { execa } from "execa"

import { ERROR_CODES, createError } from "../shared/errors"
import { assertInsideRepo, branchExists } from "./repo"

export async function createBranch(branchName: string): Promise<void> {
  await assertInsideRepo()

  const exists = await branchExists(branchName)
  if (exists) {
    throw createError(ERROR_CODES.BRANCH_EXISTS, `Branch already exists: ${branchName}`)
  }

  try {
    await execa("git", ["checkout", "-b", branchName])
  } catch (error) {
    throw createError(ERROR_CODES.GIT_COMMAND_FAILED, `Failed to create branch: ${branchName}`, error)
  }
}
