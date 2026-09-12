import { Adjudicator } from '@/lib/adjudicator';
import { Report, Evidence } from '@/lib/types';
import { createEvidence } from '@/lib/evidence';

describe('Adjudicator', () => {
  let adjudicator: Adjudicator;

  beforeEach(() => {
    adjudicator = new Adjudicator();
  });

  describe('clear verified report', () => {
    it('should return VERIFIED for report with matching evidence', () => {
      const report: Report = {
        id: 'r1',
        title: 'Test Report',
        content: 'All tests passed successfully. Database migration completed.',
        claims: ['All tests passed', 'Database migration completed'],
        submittedAt: Date.now(),
      };

      const evidence = [
        createEvidence('tool-io', 'npm test -- all tests passed'),
        createEvidence('tool-io', 'migration completed successfully'),
      ];

      const result = adjudicator.adjudicate(report, evidence);

      expect(result.verdict).toBe('VERIFIED');
      expect(result.lieProfile).toBeNull();
      expect(result.blastRadius).toBe(0);
    });
  });

  describe('tampered ledger detection', () => {
    it('should return CONTRADICTED for tampered evidence', () => {
      const report: Report = {
        id: 'r1',
        title: 'Test',
        content: 'Content',
        claims: ['Claim'],
        submittedAt: Date.now(),
      };

      const evidence = createEvidence('tool-io', 'content');
      evidence.hash = 'tampered_hash';

      const result = adjudicator.adjudicate(report, [evidence]);

      expect(result.verdict).toBe('CONTRADICTED');
      expect(result.blastRadius).toBe(100);
    });
  });

  describe('omission detection', () => {
    it('should detect omitted error information', () => {
      const report: Report = {
        id: 'r1',
        title: 'Success Report',
        content: 'Everything went well',
        claims: ['Task completed'],
        submittedAt: Date.now(),
      };

      const evidence = [
        createEvidence('tool-io', 'ERROR: Connection failed at step 3'),
      ];

      const result = adjudicator.adjudicate(report, evidence);

      expect(result.verdict).toBe('CONTRADICTED');
      expect(result.lieProfile).not.toBeNull();
      expect(result.lieProfile!.lies.some(l => l.type === 'omission')).toBe(true);
    });

    it('should not flag when errors are mentioned', () => {
      const report: Report = {
        id: 'r1',
        title: 'Report',
        content: 'Error occurred but was resolved',
        claims: ['Error was fixed'],
        submittedAt: Date.now(),
      };

      const evidence = [
        createEvidence('tool-io', 'ERROR: issue found'),
        createEvidence('tool-io', 'Resolution completed'),
      ];

      const result = adjudicator.adjudicate(report, evidence);

      expect(result.lieProfile?.lies.filter(l => l.type === 'omission').length || 0).toBe(0);
    });
  });

  describe('invention detection', () => {
    it('should detect invented claims with no evidence', () => {
      const report: Report = {
        id: 'r1',
        title: 'Report',
        content: 'Advanced machine learning model deployed',
        claims: [
          'Sophisticated neural network architecture implemented',
          'Quantum computing optimization applied',
        ],
        submittedAt: Date.now(),
      };

      const evidence = [
        createEvidence('tool-io', 'basic script executed'),
      ];

      const result = adjudicator.adjudicate(report, evidence);

      expect(result.lieProfile).not.toBeNull();
      expect(result.lieProfile!.lies.some(l => l.type === 'invention')).toBe(true);
    });
  });

  describe('mismatch detection', () => {
    it('should detect success claimed despite failure evidence', () => {
      const report: Report = {
        id: 'r1',
        title: 'Success Report',
        content: 'All operations completed successfully',
        claims: ['Everything succeeded'],
        submittedAt: Date.now(),
      };

      const evidence = [
        createEvidence('tool-io', 'Operation failed with error code 500'),
      ];

      const result = adjudicator.adjudicate(report, evidence);

      expect(result.verdict).toBe('CONTRADICTED');
      expect(result.lieProfile!.lies.some(l => l.type === 'mismatch')).toBe(true);
    });

    it('should not flag when no success is claimed', () => {
      const report: Report = {
        id: 'r1',
        title: 'Report',
        content: 'Operation attempted',
        claims: ['Task was run'],
        submittedAt: Date.now(),
      };

      const evidence = [
        createEvidence('tool-io', 'Operation failed'),
      ];

      const result = adjudicator.adjudicate(report, evidence);

      expect(result.lieProfile?.lies.filter(l => l.type === 'mismatch').length || 0).toBe(0);
    });
  });

  describe('unbacked assertion detection', () => {
    it('should detect claims without any evidence', () => {
      const report: Report = {
        id: 'r1',
        title: 'Report',
        content: 'Many things done',
        claims: ['Task A completed', 'Task B completed', 'Task C completed'],
        submittedAt: Date.now(),
      };

      const result = adjudicator.adjudicate(report, []);

      expect(result.verdict).toBe('HOLD');
      expect(result.lieProfile!.lies.every(l => l.type === 'unbacked-assert')).toBe(true);
      expect(result.lieProfile!.lies.length).toBe(3);
    });
  });

  describe('blast radius calculation', () => {
    it('should calculate higher radius for more severe lies', () => {
      const report: Report = {
        id: 'r1',
        title: 'Report',
        content: 'Success',
        claims: ['Success achieved'],
        submittedAt: Date.now(),
      };

      const evidence = [
        createEvidence('tool-io', 'Multiple critical failures detected'),
      ];

      const result = adjudicator.adjudicate(report, evidence);

      expect(result.blastRadius).toBeGreaterThan(50);
    });

    it('should return 0 radius for verified reports', () => {
      const report: Report = {
        id: 'r1',
        title: 'Report',
        content: 'Tests passed',
        claims: ['Tests passed'],
        submittedAt: Date.now(),
      };

      const evidence = [
        createEvidence('tool-io', 'All tests passed'),
      ];

      const result = adjudicator.adjudicate(report, evidence);

      expect(result.blastRadius).toBe(0);
    });
  });

  describe('verdict determination', () => {
    it('should return HOLD for moderate lies', () => {
      const report: Report = {
        id: 'r1',
        title: 'Report',
        content: 'Tasks done',
        claims: ['Task completed'],
        submittedAt: Date.now(),
      };

      const result = adjudicator.adjudicate(report, []);

      expect(result.verdict).toBe('HOLD');
    });

    it('should return CONTRADICTED for critical lies', () => {
      const report: Report = {
        id: 'r1',
        title: 'Report',
        content: 'Complete success',
        claims: ['Everything succeeded perfectly'],
        submittedAt: Date.now(),
      };

      const evidence = [
        createEvidence('tool-io', 'Critical failure occurred'),
      ];

      const result = adjudicator.adjudicate(report, evidence);

      expect(result.verdict).toBe('CONTRADICTED');
    });
  });
});
