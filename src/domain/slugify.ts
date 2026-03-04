const MAX_SLUG_LENGTH = 50

export function slugify(description: string): string {
  const asciiOnly = description
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x00-\x7F]/g, "")

  const cleaned = asciiOnly
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")

  if (cleaned.length <= MAX_SLUG_LENGTH) {
    return cleaned
  }

  return cleaned.slice(0, MAX_SLUG_LENGTH).replace(/-+$/g, "")
}
