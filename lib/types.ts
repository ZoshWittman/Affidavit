export type Verdict = 'VERIFIED' | 'CONTRADICTED' | 'HOLD';

export type LieType = 'omission' | 'invention' | 'mismatch' | 'unbacked-assert';

export interface LieInstance {
  type: LieType;
  claim: string;
  evidence?: string;
  severity: number;
}

export interface LieProfile {
  lies: LieInstance[];
  totalSeverity: number;
  blastRadius: number;
}

export interface Evidence {
  id: string;
  type: 'tool-io' | 'screenshot' | 'dom-snapshot' | 'digest';
  content: string;
  hash: string;
  timestamp: number;
}

export interface Report {
  id: string;
  title: string;
  content: string;
  claims: string[];
  submittedAt: number;
}

export interface AffidavitPacket {
  id: string;
  report: Report;
  evidenceLedger: Evidence[];
  verdict: Verdict;
  lieProfile: LieProfile | null;
  sealed: boolean;
  humanSealedBy?: string;
  humanSealedAt?: number;
  createdAt: number;
  adjudicatedAt?: number;
}

export interface AdjudicationResult {
  verdict: Verdict;
  lieProfile: LieProfile | null;
  blastRadius: number;
  reasoning: string[];
}
