import { PacketManager } from '@/lib/packet';
import { Report } from '@/lib/types';
import { createEvidence } from '@/lib/evidence';
import fs from 'fs';
import path from 'path';

describe('PacketManager', () => {
  let manager: PacketManager;
  let testDbPath: string;

  beforeEach(() => {
    testDbPath = path.join(__dirname, `test-${Date.now()}-${Math.random()}.db`);
    manager = new PacketManager(testDbPath);
  });

  afterEach(() => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('createPacket', () => {
    it('should create packet with all fields', () => {
      const report: Report = {
        id: 'r1',
        title: 'Test Report',
        content: 'Content',
        claims: ['Claim 1'],
        submittedAt: Date.now(),
      };

      const evidence = [createEvidence('tool-io', 'evidence content')];
      const packet = manager.createPacket(report, evidence);

      expect(packet.id).toBeTruthy();
      expect(packet.report).toEqual(report);
      expect(packet.evidenceLedger).toEqual(evidence);
      expect(packet.verdict).toBeTruthy();
      expect(packet.sealed).toBe(false);
    });

    it('should persist packet to database', () => {
      const report: Report = {
        id: 'r1',
        title: 'Test',
        content: 'Content',
        claims: ['Claim'],
        submittedAt: Date.now(),
      };

      const evidence = [createEvidence('tool-io', 'content')];
      const packet = manager.createPacket(report, evidence);

      const retrieved = manager.getPacket(packet.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(packet.id);
    });
  });

  describe('getPacket', () => {
    it('should retrieve existing packet', () => {
      const report: Report = {
        id: 'r1',
        title: 'Test',
        content: 'Content',
        claims: ['Claim'],
        submittedAt: Date.now(),
      };

      const evidence = [createEvidence('tool-io', 'content')];
      const created = manager.createPacket(report, evidence);
      const retrieved = manager.getPacket(created.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.report.title).toBe('Test');
      expect(retrieved!.evidenceLedger.length).toBe(1);
    });

    it('should return null for non-existent packet', () => {
      const result = manager.getPacket('non-existent-id');
      expect(result).toBeNull();
    });

    it('should preserve evidence order', () => {
      const report: Report = {
        id: 'r1',
        title: 'Test',
        content: 'Content',
        claims: ['Claim'],
        submittedAt: Date.now(),
      };

      const evidence = [
        createEvidence('tool-io', 'first'),
        createEvidence('screenshot', 'second'),
        createEvidence('digest', 'third'),
      ];

      const created = manager.createPacket(report, evidence);
      const retrieved = manager.getPacket(created.id);

      expect(retrieved!.evidenceLedger[0].content).toBe('first');
      expect(retrieved!.evidenceLedger[1].content).toBe('second');
      expect(retrieved!.evidenceLedger[2].content).toBe('third');
    });
  });

  describe('listPackets', () => {
    it('should return empty array when no packets', () => {
      const packets = manager.listPackets();
      expect(packets).toEqual([]);
    });

    it('should list all packets', () => {
      const report1: Report = {
        id: 'r1',
        title: 'Report 1',
        content: 'Content 1',
        claims: ['Claim 1'],
        submittedAt: Date.now(),
      };

      const report2: Report = {
        id: 'r2',
        title: 'Report 2',
        content: 'Content 2',
        claims: ['Claim 2'],
        submittedAt: Date.now(),
      };

      manager.createPacket(report1, []);
      manager.createPacket(report2, []);

      const packets = manager.listPackets();
      expect(packets.length).toBe(2);
    });

    it('should respect limit parameter', () => {
      for (let i = 0; i < 10; i++) {
        const report: Report = {
          id: `r${i}`,
          title: `Report ${i}`,
          content: 'Content',
          claims: ['Claim'],
          submittedAt: Date.now(),
        };
        manager.createPacket(report, []);
      }

      const packets = manager.listPackets(5);
      expect(packets.length).toBe(5);
    });

    it('should order by creation time descending', () => {
      const report1: Report = {
        id: 'r1',
        title: 'First',
        content: 'Content',
        claims: ['Claim'],
        submittedAt: Date.now(),
      };

      const report2: Report = {
        id: 'r2',
        title: 'Second',
        content: 'Content',
        claims: ['Claim'],
        submittedAt: Date.now(),
      };

      manager.createPacket(report1, []);
      manager.createPacket(report2, []);

      const packets = manager.listPackets();
      expect(packets[0].report.title).toBe('Second');
      expect(packets[1].report.title).toBe('First');
    });
  });

  describe('sealPacket', () => {
    it('should seal HOLD packet', () => {
      const report: Report = {
        id: 'r1',
        title: 'Report',
        content: 'Content',
        claims: ['Claim with no evidence'],
        submittedAt: Date.now(),
      };

      const packet = manager.createPacket(report, []);
      expect(packet.verdict).toBe('HOLD');

      const success = manager.sealPacket(packet.id, 'John Doe');
      expect(success).toBe(true);

      const sealed = manager.getPacket(packet.id);
      expect(sealed!.sealed).toBe(true);
      expect(sealed!.humanSealedBy).toBe('John Doe');
      expect(sealed!.humanSealedAt).toBeTruthy();
    });

    it('should not seal non-HOLD packet', () => {
      const report: Report = {
        id: 'r1',
        title: 'Report',
        content: 'Tests passed',
        claims: ['Tests passed'],
        submittedAt: Date.now(),
      };

      const evidence = [createEvidence('tool-io', 'all tests passed')];
      const packet = manager.createPacket(report, evidence);
      
      expect(packet.verdict).toBe('VERIFIED');

      expect(() => {
        manager.sealPacket(packet.id, 'John Doe');
      }).toThrow('Only HOLD packets can be human-sealed');
    });

    it('should return false for non-existent packet', () => {
      const success = manager.sealPacket('non-existent', 'John Doe');
      expect(success).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return zero stats for empty database', () => {
      const stats = manager.getStats();
      
      expect(stats.total).toBe(0);
      expect(stats.verified).toBe(0);
      expect(stats.contradicted).toBe(0);
      expect(stats.hold).toBe(0);
      expect(stats.sealed).toBe(0);
    });

    it('should count packets correctly', () => {
      const verifiedReport: Report = {
        id: 'r1',
        title: 'Verified',
        content: 'Success',
        claims: ['Success'],
        submittedAt: Date.now(),
      };

      const holdReport: Report = {
        id: 'r2',
        title: 'Hold',
        content: 'Content',
        claims: ['Claim'],
        submittedAt: Date.now(),
      };

      manager.createPacket(verifiedReport, [
        createEvidence('tool-io', 'Success confirmed'),
      ]);

      const holdPacket = manager.createPacket(holdReport, []);
      manager.sealPacket(holdPacket.id, 'Reviewer');

      const stats = manager.getStats();

      expect(stats.total).toBe(2);
      expect(stats.verified).toBe(1);
      expect(stats.hold).toBe(1);
      expect(stats.sealed).toBe(1);
    });
  });
});
