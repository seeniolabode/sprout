import { execa } from "execa"

import { ERROR_CODES, createError } from "../shared/errors"

export async function assertInsideRepo(): Promise<void> {
  try {
    const result = await execa("git", ["rev-parse", "--is-inside-work-tree"])

    if (result.stdout.trim() !== "true") {
      throw createError(ERROR_CODES.NOT_GIT_REPO, "Current directory is not a git repository")
    }
  } catch (error) {
    if (isNotGitRepoError(error)) {
      throw createError(ERROR_CODES.NOT_GIT_REPO, "Current directory is not a git repository", error)
    }

    throw createError(ERROR_CODES.GIT_COMMAND_FAILED, "Failed to verify git repository", error)
  }
}

export async function branchExists(branchName: string): Promise<boolean> {
  try {
    const result = await execa(
      "git",
      ["show-ref", "--verify", "--quiet", `refs/heads/${branchName}`],
      { reject: false }
    )

    if (result.exitCode === 0) {
      return true
    }

    if (result.exitCode === 1) {
      return false
    }

    throw createError(
      ERROR_CODES.GIT_COMMAND_FAILED,
      `Failed to check whether branch exists: ${branchName}`
    )
  } catch (error) {
    if (isNotGitRepoError(error)) {
      throw createError(ERROR_CODES.NOT_GIT_REPO, "Current directory is not a git repository", error)
    }

    throw createError(ERROR_CODES.GIT_COMMAND_FAILED, "Failed to check branch existence", error)
  }
}

function isNotGitRepoError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  return (
    error.message.includes("not a git repository") ||
    error.message.includes("--is-inside-work-tree")
  )
}
