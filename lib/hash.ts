import crypto from 'crypto';

export function sha256(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function verifyHash(content: string, hash: string): boolean {
  return sha256(content) === hash;
}

export function hashEvidence(type: string, content: string, timestamp: number): string {
  const combined = `${type}:${content}:${timestamp}`;
  return sha256(combined);
}
