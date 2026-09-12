import { sha256, verifyHash, hashEvidence } from '@/lib/hash';

describe('Hash Functions', () => {
  describe('sha256', () => {
    it('should generate consistent hash for same input', () => {
      const input = 'test content';
      const hash1 = sha256(input);
      const hash2 = sha256(input);
      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different inputs', () => {
      const hash1 = sha256('content1');
      const hash2 = sha256('content2');
      expect(hash1).not.toBe(hash2);
    });

    it('should generate 64-character hex string', () => {
      const hash = sha256('test');
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should handle empty string', () => {
      const hash = sha256('');
      expect(hash).toBeTruthy();
      expect(hash.length).toBe(64);
    });
  });

  describe('verifyHash', () => {
    it('should verify matching content and hash', () => {
      const content = 'test content';
      const hash = sha256(content);
      expect(verifyHash(content, hash)).toBe(true);
    });

    it('should reject mismatched content and hash', () => {
      const content = 'test content';
      const wrongHash = sha256('different content');
      expect(verifyHash(content, wrongHash)).toBe(false);
    });

    it('should reject tampered content', () => {
      const content = 'original';
      const hash = sha256(content);
      expect(verifyHash('tampered', hash)).toBe(false);
    });
  });

  describe('hashEvidence', () => {
    it('should generate consistent hash for same evidence', () => {
      const type = 'tool-io';
      const content = 'test output';
      const timestamp = 1000;
      
      const hash1 = hashEvidence(type, content, timestamp);
      const hash2 = hashEvidence(type, content, timestamp);
      
      expect(hash1).toBe(hash2);
    });

    it('should generate different hash for different type', () => {
      const content = 'test';
      const timestamp = 1000;
      
      const hash1 = hashEvidence('tool-io', content, timestamp);
      const hash2 = hashEvidence('screenshot', content, timestamp);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should generate different hash for different timestamp', () => {
      const type = 'tool-io';
      const content = 'test';
      
      const hash1 = hashEvidence(type, content, 1000);
      const hash2 = hashEvidence(type, content, 2000);
      
      expect(hash1).not.toBe(hash2);
    });
  });
});
