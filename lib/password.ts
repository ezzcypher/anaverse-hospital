import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

const N = 16384; // scrypt cost parameter (CPU/memory); node default
const KEYLEN = 64;

// Hand-rolled promise wrapper: promisify()'s types don't cover scrypt's
// options-arg overload.
function scryptAsync(
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keylen, options, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

/**
 * Hash a password for storage in ADMIN_PASSWORD_HASH.
 * Format: `scrypt:<N>:<saltHex>:<hashHex>` — self-describing so the cost can be
 * raised later without breaking existing hashes. Colon-separated (not `$`) so
 * the value survives dotenv variable-expansion unescaped.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scryptAsync(password.normalize("NFKC"), salt, KEYLEN, { N });
  return `scrypt:${N}:${salt.toString("hex")}:${derived.toString("hex")}`;
}

/** Constant-time verification. Any malformed stored value returns false. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(":");
  if (parts.length !== 4 || parts[0] !== "scrypt") return false;

  const cost = Number(parts[1]);
  const salt = Buffer.from(parts[2]!, "hex");
  const expected = Buffer.from(parts[3]!, "hex");
  if (!Number.isInteger(cost) || salt.length === 0 || expected.length === 0) {
    return false;
  }

  let derived: Buffer;
  try {
    derived = await scryptAsync(password.normalize("NFKC"), salt, expected.length, { N: cost });
  } catch {
    return false;
  }
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}
