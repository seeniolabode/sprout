import { readFile } from "node:fs/promises"
import path from "node:path"

import envPaths from "env-paths"

import { createError, ERROR_CODES } from "../shared/errors.js"
import type { AppConfig, JiraConfig } from "./types.js"

type PartialRecord = Record<string, unknown>

type LoadConfigOptions = {
  cwd?: string
  env?: Record<string, string | undefined>
  globalConfigPath?: string
}

const DEFAULT_CONFIG: AppConfig = {
  jira: {
    baseUrl: "",
    email: "",
    apiToken: "",
    jql: undefined,
    limit: 20,
    debug: false
  }
}

export async function loadConfig(options: LoadConfigOptions = {}): Promise<AppConfig> {
  const cwd = options.cwd ?? process.cwd()
  const globalConfigPath = options.globalConfigPath ?? getGlobalConfigPath()
  const projectConfigPath = path.join(cwd, ".sproutrc.json")

  const [globalConfig, projectConfig] = await Promise.all([
    readConfigFile(globalConfigPath),
    readConfigFile(projectConfigPath)
  ])

  const envConfig = readEnvConfig(options.env ?? process.env)

  const merged = deepMerge(
    DEFAULT_CONFIG as unknown as PartialRecord,
    globalConfig,
    projectConfig,
    envConfig
  )

  return merged as AppConfig
}

export function ensureJiraConfig(config: AppConfig): JiraConfig {
  const jira = config.jira

  const hasBaseUrl = jira.baseUrl.trim().length > 0
  const hasEmail = jira.email.trim().length > 0
  const hasApiToken = jira.apiToken.trim().length > 0

  if (!hasBaseUrl || !hasEmail || !hasApiToken) {
    throw createError(
      ERROR_CODES.CONFIG_NOT_FOUND,
      "Sprout configuration not found. Run `sprout init` to set up your Jira credentials."
    )
  }

  return jira
}

export function getGlobalConfigPath(): string {
  const paths = envPaths("sprout", { suffix: "" })
  return path.join(paths.config, "config.json")
}

async function readConfigFile(filePath: string): Promise<PartialRecord> {
  try {
    const contents = await readFile(filePath, "utf8")
    const parsed = JSON.parse(contents)

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {}
    }

    return parsed as PartialRecord
  } catch (error) {
    if (isNotFoundError(error)) {
      return {}
    }

    throw error
  }
}

function readEnvConfig(env: Record<string, string | undefined>): PartialRecord {
  const jira: Partial<JiraConfig> = {}

  const baseUrl = env.JIRA_BASE_URL?.trim()
  if (baseUrl) jira.baseUrl = baseUrl

  const email = env.JIRA_EMAIL?.trim()
  if (email) jira.email = email

  const apiToken = env.JIRA_API_TOKEN?.trim()
  if (apiToken) jira.apiToken = apiToken

  const jql = env.JIRA_JQL?.trim()
  if (jql) jira.jql = jql

  const limit = parseLimit(env.JIRA_LIMIT)
  if (limit !== undefined) jira.limit = limit

  const debug = parseBoolean(env.JIRA_DEBUG)
  if (debug !== undefined) jira.debug = debug

  return { jira }
}

function parseLimit(value: string | undefined): number | undefined {
  if (!value) {
    return undefined
  }

  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return undefined
  }

  return parsed
}

function parseBoolean(value: string | undefined): boolean | undefined {
  if (!value) {
    return undefined
  }

  const normalized = value.trim().toLowerCase()
  if (normalized === "true" || normalized === "1") {
    return true
  }

  if (normalized === "false" || normalized === "0") {
    return false
  }

  return undefined
}

function deepMerge(...sources: PartialRecord[]): PartialRecord {
  const result: PartialRecord = {}

  for (const source of sources) {
    for (const [key, value] of Object.entries(source)) {
      if (isPlainObject(value) && isPlainObject(result[key])) {
        result[key] = deepMerge(result[key] as PartialRecord, value)
        continue
      }

      result[key] = value
    }
  }

  return result
}

function isPlainObject(value: unknown): value is PartialRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function isNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false
  }

  const candidate = error as { code?: unknown }
  return candidate.code === "ENOENT"
}
