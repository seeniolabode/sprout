import prompts, { type PromptObject } from "prompts"

import { BRANCH_INTENTS, type BranchIntent, type JiraTicket } from "../domain/types.js"
import { ERROR_CODES, createError } from "../shared/errors.js"

type PromptValue<T> = T | undefined

export async function selectTicket(tickets: JiraTicket[]): Promise<JiraTicket> {
  const ticket = await runPrompt<JiraTicket>({
    type: "select",
    name: "value",
    message: "Select Jira ticket",
    choices: tickets.map((item) => ({
      title: `${item.key} - ${item.summary}`,
      value: item
    }))
  })

  return requirePromptValue(ticket)
}

export async function selectIntent(): Promise<BranchIntent> {
  const intent = await runPrompt<BranchIntent>({
    type: "select",
    name: "value",
    message: "Select branch intent",
    choices: BRANCH_INTENTS.map((item) => ({
      title: item,
      value: item
    }))
  })

  return requirePromptValue(intent)
}

export async function inputDescription(intent: BranchIntent): Promise<string> {
  const message = intent === "release" ? "Release version" : "Description"

  const description = await runPrompt<string>({
    type: "text",
    name: "value",
    message,
    validate: (value: string) => {
      if (value.trim().length === 0) {
        return "Value is required"
      }

      return true
    }
  })

  return requirePromptValue(description).trim()
}

export async function editBranchName(initialValue: string): Promise<string> {
  const branchName = await runPrompt<string>({
    type: "text",
    name: "value",
    message: "Branch name",
    initial: initialValue,
    validate: (value: string) => {
      if (value.trim().length === 0) {
        return "Branch name cannot be empty"
      }

      return true
    }
  })

  return requirePromptValue(branchName).trim()
}

export async function confirmBranchCreation(branchName: string): Promise<boolean> {
  const confirmed = await runPrompt<boolean>({
    type: "confirm",
    name: "value",
    message: `Create branch ${branchName}?`,
    initial: true
  })

  return requirePromptValue(confirmed)
}

async function runPrompt<T>(question: PromptObject<"value">): Promise<PromptValue<T>> {
  const response = await prompts(question, {
    onCancel: () => false
  })

  return response.value as T | undefined
}

function requirePromptValue<T>(value: PromptValue<T>): T {
  if (value === undefined) {
    throw createError(ERROR_CODES.USER_CANCELLED, "Prompt cancelled by user")
  }

  return value
}
