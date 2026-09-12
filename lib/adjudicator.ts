import { Evidence, Report, AdjudicationResult, LieInstance, LieProfile, Verdict } from './types';
import { verifyEvidenceLedger } from './evidence';

export class Adjudicator {
  adjudicate(report: Report, evidenceLedger: Evidence[]): AdjudicationResult {
    const reasoning: string[] = [];

    if (!verifyEvidenceLedger(evidenceLedger)) {
      reasoning.push('Evidence ledger integrity check failed - tampered hashes detected');
      return {
        verdict: 'CONTRADICTED',
        lieProfile: null,
        blastRadius: 100,
        reasoning,
      };
    }

    reasoning.push('Evidence ledger integrity verified');

    const lies: LieInstance[] = [];
    
    const omissions = this.detectOmissions(report, evidenceLedger);
    lies.push(...omissions);
    
    const inventions = this.detectInventions(report, evidenceLedger);
    lies.push(...inventions);
    
    const mismatches = this.detectMismatches(report, evidenceLedger);
    lies.push(...mismatches);
    
    const unbackedAssertions = this.detectUnbackedAssertions(report, evidenceLedger);
    lies.push(...unbackedAssertions);

    if (lies.length === 0) {
      reasoning.push('All claims verified against evidence');
      return {
        verdict: 'VERIFIED',
        lieProfile: null,
        blastRadius: 0,
        reasoning,
      };
    }

    const lieProfile: LieProfile = {
      lies,
      totalSeverity: lies.reduce((sum, lie) => sum + lie.severity, 0),
      blastRadius: this.calculateBlastRadius(lies, report),
    };

    reasoning.push(`Detected ${lies.length} lie(s)`);
    lies.forEach((lie) => {
      reasoning.push(`  - ${lie.type}: ${lie.claim.substring(0, 80)}...`);
    });

    const verdict = this.determineVerdict(lieProfile);
    reasoning.push(`Verdict: ${verdict} (blast radius: ${lieProfile.blastRadius})`);

    return {
      verdict,
      lieProfile,
      blastRadius: lieProfile.blastRadius,
      reasoning,
    };
  }

  private detectOmissions(report: Report, evidenceLedger: Evidence[]): LieInstance[] {
    const lies: LieInstance[] = [];
    
    const criticalEvidence = evidenceLedger.filter(e => 
      e.type === 'tool-io' && e.content.includes('ERROR')
    );

    for (const evidence of criticalEvidence) {
      const errorMentioned = report.content.toLowerCase().includes('error') ||
                            report.claims.some(c => c.toLowerCase().includes('error'));
      
      if (!errorMentioned) {
        lies.push({
          type: 'omission',
          claim: 'Report omits critical error information',
          evidence: evidence.content.substring(0, 100),
          severity: 8,
        });
      }
    }

    return lies;
  }

  private detectInventions(report: Report, evidenceLedger: Evidence[]): LieInstance[] {
    const lies: LieInstance[] = [];
    
    if (evidenceLedger.length === 0) {
      return lies;
    }
    
    const allEvidenceContent = evidenceLedger.map(e => e.content.toLowerCase()).join(' ');
    
    for (const claim of report.claims) {
      const claimKeywords = claim.toLowerCase().split(' ').filter(w => w.length > 4);
      const matchCount = claimKeywords.filter(keyword => 
        allEvidenceContent.includes(keyword)
      ).length;
      
      if (claimKeywords.length > 0 && matchCount / claimKeywords.length < 0.3) {
        lies.push({
          type: 'invention',
          claim: claim,
          severity: 9,
        });
      }
    }

    return lies;
  }

  private detectMismatches(report: Report, evidenceLedger: Evidence[]): LieInstance[] {
    const lies: LieInstance[] = [];
    
    for (const evidence of evidenceLedger) {
      if (evidence.type === 'tool-io' && evidence.content.includes('failed')) {
        const successClaimed = report.content.toLowerCase().includes('success') ||
                              report.claims.some(c => c.toLowerCase().includes('success'));
        
        if (successClaimed) {
          lies.push({
            type: 'mismatch',
            claim: 'Report claims success despite evidence of failure',
            evidence: evidence.content.substring(0, 100),
            severity: 10,
          });
        }
      }
    }

    return lies;
  }

  private detectUnbackedAssertions(report: Report, evidenceLedger: Evidence[]): LieInstance[] {
    const lies: LieInstance[] = [];
    
    if (evidenceLedger.length === 0 && report.claims.length > 0) {
      for (const claim of report.claims) {
        lies.push({
          type: 'unbacked-assert',
          claim: claim,
          severity: 7,
        });
      }
    }

    return lies;
  }

  private calculateBlastRadius(lies: LieInstance[], report: Report): number {
    const totalSeverity = lies.reduce((sum, lie) => sum + lie.severity, 0);
    const avgSeverity = totalSeverity / lies.length;
    const claimsCovered = lies.length / Math.max(report.claims.length, 1);
    
    const baseRadius = avgSeverity * 6;
    const coverageBonus = claimsCovered * 20;
    const radius = Math.min(100, baseRadius + coverageBonus);
    
    return Math.round(radius);
  }

  private determineVerdict(lieProfile: LieProfile): Verdict {
    const { totalSeverity, blastRadius, lies } = lieProfile;
    
    const hasCriticalLie = lies.some(l => l.severity >= 9);
    
    if (hasCriticalLie || blastRadius >= 70) {
      return 'CONTRADICTED';
    }
    
    if (blastRadius >= 40 || totalSeverity >= 15) {
      return 'HOLD';
    }
    
    return 'VERIFIED';
  }
}
