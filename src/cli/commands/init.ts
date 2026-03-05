import { chmod, mkdir, writeFile, access } from "node:fs/promises"
import { constants } from "node:fs"
import path from "node:path"

import prompts from "prompts"

import { getGlobalConfigPath } from "../../config/loadConfig.js"
import { createError, ERROR_CODES } from "../../shared/errors.js"
import { printWarning, withSpinner } from "../output.js"

type InitAnswers = {
  baseUrl: string
  email: string
  apiToken: string
  limit: string
}

export async function runInitCommand(): Promise<void> {
  const configPath = getGlobalConfigPath()

  const shouldWrite = await shouldWriteConfig(configPath)
  if (!shouldWrite) {
    return
  }

  const answers = await promptForConfig()

  const limit = Number(answers.limit)
  const resolvedLimit = Number.isInteger(limit) && limit > 0 ? limit : 20

  const payload = {
    jira: {
      baseUrl: answers.baseUrl.trim(),
      email: answers.email.trim(),
      apiToken: answers.apiToken,
      limit: resolvedLimit,
      debug: false
    }
  }

  await withSpinner(
    "Saving global configuration...",
    async () => {
      await mkdir(path.dirname(configPath), { recursive: true, mode: 0o700 })
      await writeFile(configPath, `${JSON.stringify(payload, null, 2)}\n`, { mode: 0o600 })

      try {
        await chmod(configPath, 0o600)
      } catch {
        // Best effort for platforms that do not support POSIX permission bits.
      }
    },
    `Saved global configuration to ${configPath}`
  )
}

async function shouldWriteConfig(configPath: string): Promise<boolean> {
  try {
    await access(configPath, constants.F_OK)

    printWarning(`Config already exists at ${configPath}`)
    const overwrite = await promptConfirm("Overwrite existing config?", false)

    return overwrite
  } catch (error) {
    if (isNotFoundError(error)) {
      return true
    }

    throw error
  }
}

async function promptForConfig(): Promise<InitAnswers> {
  const answers = await prompts(
    [
      {
        type: "text",
        name: "baseUrl",
        message: "Jira base URL",
        validate: (value: string) => (value.trim().length > 0 ? true : "Base URL is required")
      },
      {
        type: "text",
        name: "email",
        message: "Jira email",
        validate: (value: string) => (value.trim().length > 0 ? true : "Email is required")
      },
      {
        type: "password",
        name: "apiToken",
        message: "Jira API token",
        validate: (value: string) => (value.trim().length > 0 ? true : "API token is required")
      },
      {
        type: "text",
        name: "limit",
        message: "Jira ticket limit",
        initial: "20",
        validate: (value: string) => {
          const parsed = Number(value)
          return Number.isInteger(parsed) && parsed > 0 ? true : "Limit must be a positive integer"
        }
      }
    ],
    {
      onCancel: () => false
    }
  )

  if (!answers.baseUrl || !answers.email || !answers.apiToken || !answers.limit) {
    throw createError(ERROR_CODES.USER_CANCELLED, "Prompt cancelled by user")
  }

  return answers as InitAnswers
}

async function promptConfirm(message: string, initial: boolean): Promise<boolean> {
  const answer = await prompts(
    {
      type: "confirm",
      name: "value",
      message,
      initial
    },
    {
      onCancel: () => false
    }
  )

  return Boolean(answer.value)
}

function isNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false
  }

  const candidate = error as { code?: unknown }
  return candidate.code === "ENOENT"
}
