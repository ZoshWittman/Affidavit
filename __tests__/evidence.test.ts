import { createEvidence, verifyEvidenceLedger, detectTamperedEvidence } from '@/lib/evidence';
import { Evidence } from '@/lib/types';

describe('Evidence Functions', () => {
  describe('createEvidence', () => {
    it('should create evidence with all required fields', () => {
      const evidence = createEvidence('tool-io', 'test content');
      
      expect(evidence.id).toBeTruthy();
      expect(evidence.type).toBe('tool-io');
      expect(evidence.content).toBe('test content');
      expect(evidence.hash).toBeTruthy();
      expect(evidence.timestamp).toBeGreaterThan(0);
    });

    it('should create unique IDs for each evidence', () => {
      const ev1 = createEvidence('tool-io', 'content');
      const ev2 = createEvidence('tool-io', 'content');
      
      expect(ev1.id).not.toBe(ev2.id);
    });

    it('should support different evidence types', () => {
      const types: Array<'tool-io' | 'screenshot' | 'dom-snapshot' | 'digest'> = [
        'tool-io',
        'screenshot',
        'dom-snapshot',
        'digest'
      ];
      
      types.forEach(type => {
        const evidence = createEvidence(type, 'content');
        expect(evidence.type).toBe(type);
      });
    });

    it('should handle empty content', () => {
      const evidence = createEvidence('digest', '');
      expect(evidence.content).toBe('');
      expect(evidence.hash).toBeTruthy();
    });
  });

  describe('verifyEvidenceLedger', () => {
    it('should verify valid evidence ledger', () => {
      const evidence1 = createEvidence('tool-io', 'content1');
      const evidence2 = createEvidence('screenshot', 'content2');
      
      const result = verifyEvidenceLedger([evidence1, evidence2]);
      expect(result).toBe(true);
    });

    it('should reject ledger with tampered hash', () => {
      const evidence = createEvidence('tool-io', 'content');
      evidence.hash = 'tampered_hash';
      
      const result = verifyEvidenceLedger([evidence]);
      expect(result).toBe(false);
    });

    it('should reject ledger with tampered content', () => {
      const evidence = createEvidence('tool-io', 'original');
      evidence.content = 'tampered';
      
      const result = verifyEvidenceLedger([evidence]);
      expect(result).toBe(false);
    });

    it('should verify empty ledger', () => {
      const result = verifyEvidenceLedger([]);
      expect(result).toBe(true);
    });

    it('should detect tampered timestamp', () => {
      const evidence = createEvidence('tool-io', 'content');
      evidence.timestamp = evidence.timestamp + 1;
      
      const result = verifyEvidenceLedger([evidence]);
      expect(result).toBe(false);
    });
  });

  describe('detectTamperedEvidence', () => {
    it('should return empty array for valid ledger', () => {
      const evidence = createEvidence('tool-io', 'content');
      const tampered = detectTamperedEvidence([evidence]);
      
      expect(tampered).toEqual([]);
    });

    it('should detect tampered evidence', () => {
      const evidence = createEvidence('tool-io', 'content');
      evidence.hash = 'fake_hash';
      
      const tampered = detectTamperedEvidence([evidence]);
      expect(tampered.length).toBe(1);
      expect(tampered[0]).toBe(evidence);
    });

    it('should detect multiple tampered items', () => {
      const ev1 = createEvidence('tool-io', 'c1');
      const ev2 = createEvidence('tool-io', 'c2');
      const ev3 = createEvidence('tool-io', 'c3');
      
      ev1.hash = 'fake1';
      ev3.hash = 'fake3';
      
      const tampered = detectTamperedEvidence([ev1, ev2, ev3]);
      expect(tampered.length).toBe(2);
      expect(tampered).toContain(ev1);
      expect(tampered).toContain(ev3);
    });
  });
});
