import { Evidence } from './types';
import { hashEvidence } from './hash';
import crypto from 'crypto';

export function createEvidence(
  type: 'tool-io' | 'screenshot' | 'dom-snapshot' | 'digest',
  content: string
): Evidence {
  const timestamp = Date.now();
  const id = crypto.randomUUID();
  const hash = hashEvidence(type, content, timestamp);

  return {
    id,
    type,
    content,
    hash,
    timestamp,
  };
}

export function verifyEvidenceLedger(evidenceList: Evidence[]): boolean {
  for (const evidence of evidenceList) {
    const expectedHash = hashEvidence(
      evidence.type,
      evidence.content,
      evidence.timestamp
    );
    if (evidence.hash !== expectedHash) {
      return false;
    }
  }
  return true;
}

export function detectTamperedEvidence(evidenceList: Evidence[]): Evidence[] {
  return evidenceList.filter((evidence) => {
    const expectedHash = hashEvidence(
      evidence.type,
      evidence.content,
      evidence.timestamp
    );
    return evidence.hash !== expectedHash;
  });
}
