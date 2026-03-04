#!/usr/bin/env node
import "dotenv/config"

import { Command } from "commander"

import { runCustomCommand } from "./commands/custom.js"
import { runInitCommand } from "./commands/init.js"
import { runJiraCommand } from "./commands/jira.js"
import { isCancelledError, printError } from "./output.js"

export async function runCli(argv: string[]): Promise<void> {
  const program = new Command()

  program.name("sprout").description("Create git branches from Jira tickets or manual input")

  program
    .command("init")
    .description("Initialize global Sprout configuration")
    .action(async () => {
      await runInitCommand()
    })

  program
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

  try {
    await runCli(argv)
  } catch (error) {
    if (isCancelledError(error)) {
      console.log("Cancelled.")
      return
    }

    printError(error, false)
    if (runtime) {
      runtime.exitCode = 1
    }
  }
}

function getRuntimeProcess(): { argv?: string[]; exitCode?: number } | undefined {
  const globalRuntime = globalThis as {
    process?: { argv?: string[]; exitCode?: number }
  }

  return globalRuntime.process
}

void main()
