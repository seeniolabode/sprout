import { mkdir, mkdtemp, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"

import { describe, expect, it } from "vitest"

import { ensureJiraConfig, loadConfig } from "../../src/config/loadConfig"
import { ERROR_CODES } from "../../src/shared/errors"

async function createTempDir(): Promise<string> {
  return mkdtemp(path.join(os.tmpdir(), "sprout-config-test-"))
}

async function writeJson(filePath: string, data: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, JSON.stringify(data, null, 2), "utf8")
}

describe("loadConfig", () => {
  it("loads global config when available", async () => {
    const cwd = await createTempDir()
    const globalConfigPath = path.join(await createTempDir(), "config.json")

    await writeJson(globalConfigPath, {
      jira: {
        baseUrl: "https://global.atlassian.net",
        email: "global@example.com",
        apiToken: "global-token",
        limit: 15
      }
    })

    const config = await loadConfig({ cwd, globalConfigPath, env: {} })

    expect(config.jira.baseUrl).toBe("https://global.atlassian.net")
    expect(config.jira.email).toBe("global@example.com")
    expect(config.jira.apiToken).toBe("global-token")
    expect(config.jira.limit).toBe(15)
    expect(config.jira.debug).toBe(false)
  })

  it("project config overrides global config", async () => {
    const cwd = await createTempDir()
    const globalConfigPath = path.join(await createTempDir(), "config.json")

    await writeJson(globalConfigPath, {
      jira: {
        baseUrl: "https://global.atlassian.net",
        email: "global@example.com",
        apiToken: "global-token",
        limit: 20
      }
    })

    await writeJson(path.join(cwd, ".sproutrc.json"), {
      jira: {
        limit: 10
      }
    })

    const config = await loadConfig({ cwd, globalConfigPath, env: {} })

    expect(config.jira.limit).toBe(10)
    expect(config.jira.baseUrl).toBe("https://global.atlassian.net")
  })

  it("environment variables override project and global config", async () => {
    const cwd = await createTempDir()
    const globalConfigPath = path.join(await createTempDir(), "config.json")

    await writeJson(globalConfigPath, {
      jira: {
        baseUrl: "https://global.atlassian.net",
        email: "global@example.com",
        apiToken: "global-token",
        limit: 20,
        debug: false
      }
    })

    await writeJson(path.join(cwd, ".sproutrc.json"), {
      jira: {
        limit: 8,
        debug: false
      }
    })

    const config = await loadConfig({
      cwd,
      globalConfigPath,
      env: {
        JIRA_LIMIT: "5",
        JIRA_DEBUG: "true",
        JIRA_EMAIL: "env@example.com"
      }
    })

    expect(config.jira.limit).toBe(5)
    expect(config.jira.debug).toBe(true)
    expect(config.jira.email).toBe("env@example.com")
  })

  it("throws config guidance when required jira credentials are missing", async () => {
    const cwd = await createTempDir()
    const globalConfigPath = path.join(await createTempDir(), "config.json")

    const config = await loadConfig({ cwd, globalConfigPath, env: {} })

    expect(() => ensureJiraConfig(config)).toThrowError(/sprout init/i)

    try {
      ensureJiraConfig(config)
    } catch (error) {
      expect(error).toMatchObject({ code: ERROR_CODES.CONFIG_NOT_FOUND })
    }
  })
})
