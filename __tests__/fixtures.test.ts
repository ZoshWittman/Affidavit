import { Adjudicator } from '@/lib/adjudicator';
import { Report } from '@/lib/types';
import { createEvidence } from '@/lib/evidence';
import fs from 'fs';
import path from 'path';

describe('Fixture Tests', () => {
  const adjudicator = new Adjudicator();
  const fixturesDir = path.join(process.cwd(), 'fixtures');

  it('clear-verified should produce VERIFIED verdict', () => {
    const fixture = JSON.parse(
      fs.readFileSync(path.join(fixturesDir, 'clear-verified.json'), 'utf-8')
    );

    const report: Report = {
      id: 'test',
      title: fixture.report.title,
      content: fixture.report.content,
      claims: fixture.report.claims,
      submittedAt: Date.now(),
    };

    const evidence = fixture.evidence.map((e: any) =>
      createEvidence(e.type, e.content)
    );

    const result = adjudicator.adjudicate(report, evidence);
    expect(result.verdict).toBe('VERIFIED');
  });

  it('omission-contradicted should produce CONTRADICTED verdict', () => {
    const fixture = JSON.parse(
      fs.readFileSync(path.join(fixturesDir, 'omission-contradicted.json'), 'utf-8')
    );

    const report: Report = {
      id: 'test',
      title: fixture.report.title,
      content: fixture.report.content,
      claims: fixture.report.claims,
      submittedAt: Date.now(),
    };

    const evidence = fixture.evidence.map((e: any) =>
      createEvidence(e.type, e.content)
    );

    const result = adjudicator.adjudicate(report, evidence);
    expect(result.verdict).toBe('CONTRADICTED');
  });

  it('invention-contradicted should produce CONTRADICTED verdict', () => {
    const fixture = JSON.parse(
      fs.readFileSync(path.join(fixturesDir, 'invention-contradicted.json'), 'utf-8')
    );

    const report: Report = {
      id: 'test',
      title: fixture.report.title,
      content: fixture.report.content,
      claims: fixture.report.claims,
      submittedAt: Date.now(),
    };

    const evidence = fixture.evidence.map((e: any) =>
      createEvidence(e.type, e.content)
    );

    const result = adjudicator.adjudicate(report, evidence);
    expect(result.verdict).toBe('CONTRADICTED');
  });

  it('unbacked-hold should produce HOLD verdict', () => {
    const fixture = JSON.parse(
      fs.readFileSync(path.join(fixturesDir, 'unbacked-hold.json'), 'utf-8')
    );

    const report: Report = {
      id: 'test',
      title: fixture.report.title,
      content: fixture.report.content,
      claims: fixture.report.claims,
      submittedAt: Date.now(),
    };

    const evidence = fixture.evidence.map((e: any) =>
      createEvidence(e.type, e.content)
    );

    const result = adjudicator.adjudicate(report, evidence);
    expect(result.verdict).toBe('HOLD');
  });

  it('tampered-ledger should produce CONTRADICTED verdict', () => {
    const fixture = JSON.parse(
      fs.readFileSync(path.join(fixturesDir, 'tampered-ledger.json'), 'utf-8')
    );

    const report: Report = {
      id: 'test',
      title: fixture.report.title,
      content: fixture.report.content,
      claims: fixture.report.claims,
      submittedAt: Date.now(),
    };

    const evidence = fixture.evidence.map((e: any) => {
      const ev = createEvidence(e.type, e.content);
      if (e.tamper === 'hash') {
        ev.hash = 'tampered_fake_hash_1234567890abcdef';
      }
      return ev;
    });

    const result = adjudicator.adjudicate(report, evidence);
    expect(result.verdict).toBe('CONTRADICTED');
    expect(result.blastRadius).toBe(100);
  });
});
