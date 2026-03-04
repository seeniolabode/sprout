import { BranchInput } from "./types.js"
import { slugify } from "./slugify.js"

function sanitizeReleaseVersion(version: string): string {
  return version
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function generateBranchName(input: BranchInput): string {
  if (input.intent === "release" && !input.issueKey) {
    const version = sanitizeReleaseVersion(input.description)
    if (!version) {
      throw new Error("Release version is empty after sanitization")
    }
    return `release/${version}`
  }

  const slug = slugify(input.description)
  if (!slug) {
    throw new Error("Description produced an empty slug")
  }

  if (input.issueKey) {
    return `${input.intent}/${input.issueKey}-${slug}`
  }

  return `${input.intent}/${slug}`
}
