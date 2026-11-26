const HASH_PREFIX = 'sha256:';

/**
 * Hash a password using Web Crypto SHA-256 (with fallback if subtle crypto is unavailable).
 */
export async function hashPassword(plain: string): Promise<string> {
  const trimmed = (plain || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith(HASH_PREFIX)) return trimmed;

  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const data = new TextEncoder().encode(`minetask1835:${trimmed}`);
      const digest = await crypto.subtle.digest('SHA-256', data);
      const hex = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      return `${HASH_PREFIX}${hex}`;
    }
  } catch {}
  return trimmed;
}

/**
 * Verify input password against stored password (supports both sha256: hashes and legacy plaintext).
 */
export async function verifyPassword(input: string, stored: string | undefined): Promise<{ valid: boolean; needsUpgrade: boolean }> {
  const cleanStored = (stored || '').trim();
  const cleanInput = (input || '').trim();

  if (!cleanStored) {
    return { valid: true, needsUpgrade: !!cleanInput };
  }

  if (cleanStored.startsWith(HASH_PREFIX)) {
    const hashed = await hashPassword(cleanInput);
    return { valid: hashed === cleanStored, needsUpgrade: false };
  }

  const valid = cleanInput === cleanStored;
  return { valid, needsUpgrade: valid };
}
