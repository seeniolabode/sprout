import { describe, expect, it } from "vitest"
import { slugify } from "../../src/domain/slugify.js"

describe("slugify", () => {
  it("lowercases and converts spaces to hyphens", () => {
    expect(slugify("Edit Flow")).
      toBe("edit-flow")
  })

  it("removes punctuation and symbols", () => {
    expect(slugify("Fix: save() failing @ scale!"))
      .toBe("fix-save-failing-scale")
  })

  it("removes emoji and non-ascii characters", () => {
    expect(slugify("Ship 🚀 café naïve Привет"))
      .toBe("ship-cafe-naive")
  })

  it("collapses repeated separators and trims hyphens", () => {
    expect(slugify("  --- A   very   spaced --- title --- "))
      .toBe("a-very-spaced-title")
  })

  it("truncates to 50 chars and removes trailing hyphen after truncation", () => {
    const long = "a".repeat(30) + " " + "b".repeat(30)
    expect(slugify(long))
      .toBe("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbbbbb")
    expect(slugify(long).length).toBeLessThanOrEqual(50)
  })

  it("returns empty string when all characters are stripped", () => {
    expect(slugify("🚀✨!!!"))
      .toBe("")
  })
})
