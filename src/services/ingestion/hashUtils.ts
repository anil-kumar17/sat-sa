/**
 * Cryptographic Fingerprint Utility
 * 
 * Computes SHA-256 hash using the browser's Web Crypto API for input integrity
 * verification and provenance tracing. Note: This verifies the integrity of the
 * ingested content and establishes a reproducible local digest; it does not claim
 * external legal attestation.
 */
export async function computeSha256(content: string | ArrayBuffer): Promise<string> {
  try {
    const buffer = typeof content === 'string' ? new TextEncoder().encode(content) : content;
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (err) {
    console.warn('Web Crypto API unavailable or threw error, falling back to simulated hash:', err);
  }

  // Deterministic fallback hash if Web Crypto API is unavailable in restricted iframe contexts
  const str = typeof content === 'string' ? content : new TextDecoder().decode(content);
  let h1 = 0xdeadbeef;
  let h2 = 0x41c64e6d;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hashHex = (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(16, '0');
  return `sha256-sim-${hashHex}${hashHex.split('').reverse().join('')}`;
}
