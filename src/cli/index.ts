import "dotenv/config"

import { Command } from "commander"

import { runCustomCommand } from "./commands/custom"
import { runJiraCommand } from "./commands/jira"
import { isCancelledError, printError } from "./output"

export async function runCli(argv: string[]): Promise<void> {
  const program = new Command()

  program
    .name("sprout")
    .description("Create git branches from Jira tickets or manual input")
    .option("-c, --custom", "Use custom mode")
    .action(async (options: { custom?: boolean }) => {
      if (options.custom) {
        await runCustomCommand()
        return
      }

      await runJiraCommand()
    })

  await program.parseAsync(argv)
}

async function main(): Promise<void> {
  const runtime = getRuntimeProcess()
  const argv = runtime?.argv ?? []
  const debug = isDebugEnabled()

  try {
    await runCli(argv)
  } catch (error) {
    if (isCancelledError(error)) {
      console.log("Cancelled.")
      return
    }

    printError(error, debug)
    if (runtime) {
      runtime.exitCode = 1
    }
  }
}

function isDebugEnabled(): boolean {
  const runtime = getRuntimeProcess()
  const value = runtime?.env?.JIRA_DEBUG ?? runtime?.env?.SPROUT_DEBUG

  return value === "1" || value === "true"
}

function getRuntimeProcess():
  | { argv?: string[]; env?: Record<string, string | undefined>; exitCode?: number }
  | undefined {
  const globalRuntime = globalThis as {
    process?: { argv?: string[]; env?: Record<string, string | undefined>; exitCode?: number }
  }

  return globalRuntime.process
}

void main()
