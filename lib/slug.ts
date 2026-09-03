import { randomInt } from "node:crypto";

const COMBINING = new RegExp("[\\u0300-\\u036f]", "g");

/** URL/id-safe slug from a label. Falls back to a random token if empty. */
export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(COMBINING, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || `item-${randomInt(100000, 1000000)}`;
}

/** Append a short random suffix to keep slugs unique without a DB round-trip. */
export function uniqueSlug(input: string): string {
  return `${slugify(input)}-${randomInt(10000, 100000)}`;
}
