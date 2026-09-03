#!/usr/bin/env node
/**
 * Generate an ADMIN_PASSWORD_HASH value.
 *
 *   npm run admin:hash -- 'the-admin-password'
 *
 * Copy the printed line into .env. The plaintext password is never stored
 * anywhere — only this scrypt hash goes in the environment.
 */
import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const N = 16384;
const KEYLEN = 64;

const password = process.argv[2];
if (!password || password.length < 10) {
  console.error(
    "Usage: npm run admin:hash -- '<password>'\n" +
      "The password must be at least 10 characters.",
  );
  process.exit(1);
}

const salt = randomBytes(16);
const derived = await scryptAsync(password.normalize("NFKC"), salt, KEYLEN, { N });
const hash = `scrypt:${N}:${salt.toString("hex")}:${derived.toString("hex")}`;

console.log("\nAdd this to your .env (no quotes needed):\n");
console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
