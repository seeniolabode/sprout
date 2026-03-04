import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("execa", () => ({
  execa: vi.fn()
}))

vi.mock("../../src/git/repo", () => ({
  assertInsideRepo: vi.fn(),
  branchExists: vi.fn()
}))

import { execa } from "execa"

import { createBranch } from "../../src/git/gitClient"
import { assertInsideRepo, branchExists } from "../../src/git/repo"
import { ERROR_CODES } from "../../src/shared/errors"

describe("git client", () => {
  const execaMock = vi.mocked(execa)
  const assertInsideRepoMock = vi.mocked(assertInsideRepo)
  const branchExistsMock = vi.mocked(branchExists)

  beforeEach(() => {
    vi.clearAllMocks()
    assertInsideRepoMock.mockResolvedValue(undefined)
    branchExistsMock.mockResolvedValue(false)
    execaMock.mockResolvedValue({} as never)
  })

  it("creates branch when repo is valid and branch does not exist", async () => {
    await expect(createBranch("feat/MC-37-edit-flow")).resolves.toBeUndefined()

    expect(assertInsideRepoMock).toHaveBeenCalledTimes(1)
    expect(branchExistsMock).toHaveBeenCalledWith("feat/MC-37-edit-flow")
    expect(execaMock).toHaveBeenCalledWith("git", ["checkout", "-b", "feat/MC-37-edit-flow"])
  })

  it("throws BRANCH_EXISTS when branch already exists", async () => {
    branchExistsMock.mockResolvedValueOnce(true)

    await expect(createBranch("feat/existing")).rejects.toMatchObject({
      code: ERROR_CODES.BRANCH_EXISTS
    })

    expect(execaMock).not.toHaveBeenCalled()
  })

  it("propagates NOT_GIT_REPO from repo assertion", async () => {
    assertInsideRepoMock.mockRejectedValueOnce({ code: ERROR_CODES.NOT_GIT_REPO })

    await expect(createBranch("feat/test")).rejects.toMatchObject({
      code: ERROR_CODES.NOT_GIT_REPO
    })

    expect(branchExistsMock).not.toHaveBeenCalled()
    expect(execaMock).not.toHaveBeenCalled()
  })

  it("throws GIT_COMMAND_FAILED when checkout command fails", async () => {
    execaMock.mockRejectedValueOnce(new Error("checkout failed"))

    await expect(createBranch("feat/new-branch")).rejects.toMatchObject({
      code: ERROR_CODES.GIT_COMMAND_FAILED
    })
  })
})
