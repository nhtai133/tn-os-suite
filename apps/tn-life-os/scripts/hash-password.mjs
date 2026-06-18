// Usage: node scripts/hash-password.mjs yourpassword
// Outputs the base64-encoded bcrypt hash for OWNER_PASSWORD_HASH in .env.local

import bcrypt from "bcryptjs";

const password = process.argv[2];
if (!password) {
  console.error("Usage: node scripts/hash-password.mjs <password>");
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
const b64 = Buffer.from(hash).toString("base64");

console.log("\nPaste this into your .env.local:\n");
console.log(`OWNER_PASSWORD_HASH=${b64}\n`);
console.log("Auth secret (generate a new one):");
console.log("  openssl rand -base64 32 | tr '+/' '_-' | tr -d '='\n");
