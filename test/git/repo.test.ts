import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("execa", () => ({
  execa: vi.fn()
}))

import { execa } from "execa"

import { assertInsideRepo, branchExists } from "../../src/git/repo"
import { ERROR_CODES } from "../../src/shared/errors"

describe("git repo adapter", () => {
  const execaMock = vi.mocked(execa)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("assertInsideRepo succeeds when git reports inside work tree", async () => {
    execaMock.mockResolvedValueOnce({ stdout: "true\n" } as never)

    await expect(assertInsideRepo()).resolves.toBeUndefined()

    expect(execaMock).toHaveBeenCalledWith("git", ["rev-parse", "--is-inside-work-tree"])
  })

  it("assertInsideRepo throws NOT_GIT_REPO when output is not true", async () => {
    execaMock.mockResolvedValueOnce({ stdout: "false\n" } as never)

    await expect(assertInsideRepo()).rejects.toMatchObject({
      code: ERROR_CODES.NOT_GIT_REPO
    })
  })

  it("assertInsideRepo throws NOT_GIT_REPO when git says not a repo", async () => {
    execaMock.mockRejectedValueOnce(new Error("fatal: not a git repository"))

    await expect(assertInsideRepo()).rejects.toMatchObject({
      code: ERROR_CODES.NOT_GIT_REPO
    })
  })

  it("assertInsideRepo throws GIT_COMMAND_FAILED for other git failures", async () => {
    execaMock.mockRejectedValueOnce(new Error("spawn error"))

    await expect(assertInsideRepo()).rejects.toMatchObject({
      code: ERROR_CODES.GIT_COMMAND_FAILED
    })
  })

  it("branchExists returns true when branch exists", async () => {
    execaMock.mockResolvedValueOnce({ exitCode: 0 } as never)

    await expect(branchExists("feat/test")).resolves.toBe(true)

    expect(execaMock).toHaveBeenCalledWith(
      "git",
      ["show-ref", "--verify", "--quiet", "refs/heads/feat/test"],
      { reject: false }
    )
  })

  it("branchExists returns false when branch does not exist", async () => {
    execaMock.mockResolvedValueOnce({ exitCode: 1 } as never)

    await expect(branchExists("feat/missing")).resolves.toBe(false)
  })

  it("branchExists throws GIT_COMMAND_FAILED on unexpected exit code", async () => {
    execaMock.mockResolvedValueOnce({ exitCode: 128 } as never)

    await expect(branchExists("feat/bad")).rejects.toMatchObject({
      code: ERROR_CODES.GIT_COMMAND_FAILED
    })
  })

  it("branchExists throws NOT_GIT_REPO when git says not a repo", async () => {
    execaMock.mockRejectedValueOnce(new Error("fatal: not a git repository"))

    await expect(branchExists("feat/test")).rejects.toMatchObject({
      code: ERROR_CODES.NOT_GIT_REPO
    })
  })
})
