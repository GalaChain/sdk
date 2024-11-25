let crypto: typeof import("node:crypto") | undefined;

Promise.resolve().then(async () => {
  try {
    crypto = (await import("node:crypto")).default;
  } catch (err) {
    console.error("Node.js crypto support is disabled!");
  }
});

export function randomUniqueKey(): string {
  // Try Node.js crypto first
  if (crypto) {
    return crypto.randomBytes(32).toString("base64");
  }

  // Fallback to Web Crypto API
  if (typeof globalThis !== "undefined" && globalThis.crypto) {
    return globalThis.crypto.randomUUID();
  }

  throw new Error("No cryptographically secure random number generator available");
}
