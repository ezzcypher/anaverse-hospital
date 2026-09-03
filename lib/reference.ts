import { randomInt } from "node:crypto";

// Unambiguous alphabet — no 0/O, 1/I/L.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Short, human-quotable appointment reference, e.g. "AV-7F3K2Q". */
export function makeReference(): string {
  let out = "";
  for (let i = 0; i < 6; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return `AV-${out}`;
}
