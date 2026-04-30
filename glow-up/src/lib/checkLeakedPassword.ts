/**
 * Check if a password has been leaked using the HaveIBeenPwned Pwned Passwords API.
 * Uses k-Anonymity model: only the first 5 chars of the SHA-1 hash are sent to the API.
 * Returns the number of times the password was found in breaches, or 0 if clean.
 */
export async function checkLeakedPassword(password: string): Promise<number> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();

  const prefix = hashHex.slice(0, 5);
  const suffix = hashHex.slice(5);

  try {
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    if (!res.ok) return 0; // fail-open: don't block signup if API is down
    const text = await res.text();
    const lines = text.split("\n");
    for (const line of lines) {
      const [hash, count] = line.trim().split(":");
      if (hash === suffix) return parseInt(count, 10);
    }
    return 0;
  } catch {
    return 0; // fail-open
  }
}
