import { AffidavitPacket, Report, Evidence, Verdict, LieProfile } from './types';
import { Adjudicator } from './adjudicator';
import { getDatabase, initializeDatabase } from '@/db/schema';
import crypto from 'crypto';

export class PacketManager {
  private db;
  private adjudicator: Adjudicator;

  constructor(dbPath?: string) {
    this.db = dbPath ? initializeDatabase(dbPath) : getDatabase();
    this.adjudicator = new Adjudicator();
  }

  createPacket(report: Report, evidenceLedger: Evidence[]): AffidavitPacket {
    const adjudication = this.adjudicator.adjudicate(report, evidenceLedger);
    
    const packet: AffidavitPacket = {
      id: crypto.randomUUID(),
      report,
      evidenceLedger,
      verdict: adjudication.verdict,
      lieProfile: adjudication.lieProfile,
      sealed: false,
      createdAt: Date.now(),
      adjudicatedAt: Date.now(),
    };

    this.db.prepare(`
      INSERT INTO packets (
        id, report_id, report_title, report_content, report_claims,
        report_submitted_at, verdict, lie_profile, sealed, created_at, adjudicated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      packet.id,
      report.id,
      report.title,
      report.content,
      JSON.stringify(report.claims),
      report.submittedAt,
      packet.verdict,
      packet.lieProfile ? JSON.stringify(packet.lieProfile) : null,
      packet.sealed ? 1 : 0,
      packet.createdAt,
      packet.adjudicatedAt
    );

    for (const evidence of evidenceLedger) {
      this.db.prepare(`
        INSERT INTO evidence (id, packet_id, type, content, hash, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        evidence.id,
        packet.id,
        evidence.type,
        evidence.content,
        evidence.hash,
        evidence.timestamp
      );
    }

    return packet;
  }

  getPacket(id: string): AffidavitPacket | null {
    const row = this.db.prepare(`
      SELECT * FROM packets WHERE id = ?
    `).get(id) as any;

    if (!row) return null;

    const evidenceRows = this.db.prepare(`
      SELECT * FROM evidence WHERE packet_id = ? ORDER BY timestamp ASC
    `).all(row.id) as any[];

    return {
      id: row.id,
      report: {
        id: row.report_id,
        title: row.report_title,
        content: row.report_content,
        claims: JSON.parse(row.report_claims),
        submittedAt: row.report_submitted_at,
      },
      evidenceLedger: evidenceRows.map((e) => ({
        id: e.id,
        type: e.type,
        content: e.content,
        hash: e.hash,
        timestamp: e.timestamp,
      })),
      verdict: row.verdict as Verdict,
      lieProfile: row.lie_profile ? JSON.parse(row.lie_profile) : null,
      sealed: row.sealed === 1,
      humanSealedBy: row.human_sealed_by,
      humanSealedAt: row.human_sealed_at,
      createdAt: row.created_at,
      adjudicatedAt: row.adjudicated_at,
    };
  }

  listPackets(limit: number = 50): AffidavitPacket[] {
    const rows = this.db.prepare(`
      SELECT * FROM packets ORDER BY created_at DESC LIMIT ?
    `).all(limit) as any[];

    return rows.map((row) => {
      const evidenceRows = this.db.prepare(`
        SELECT * FROM evidence WHERE packet_id = ? ORDER BY timestamp ASC
      `).all(row.id) as any[];

      return {
        id: row.id,
        report: {
          id: row.report_id,
          title: row.report_title,
          content: row.report_content,
          claims: JSON.parse(row.report_claims),
          submittedAt: row.report_submitted_at,
        },
        evidenceLedger: evidenceRows.map((e) => ({
          id: e.id,
          type: e.type,
          content: e.content,
          hash: e.hash,
          timestamp: e.timestamp,
        })),
        verdict: row.verdict as Verdict,
        lieProfile: row.lie_profile ? JSON.parse(row.lie_profile) : null,
        sealed: row.sealed === 1,
        humanSealedBy: row.human_sealed_by,
        humanSealedAt: row.human_sealed_at,
        createdAt: row.created_at,
        adjudicatedAt: row.adjudicated_at,
      };
    });
  }

  sealPacket(id: string, humanName: string): boolean {
    const packet = this.getPacket(id);
    if (!packet) return false;

    if (packet.verdict !== 'HOLD') {
      throw new Error('Only HOLD packets can be human-sealed');
    }

    const result = this.db.prepare(`
      UPDATE packets 
      SET sealed = 1, human_sealed_by = ?, human_sealed_at = ?
      WHERE id = ? AND verdict = 'HOLD'
    `).run(humanName, Date.now(), id);

    return result.changes > 0;
  }

  getStats() {
    const total = this.db.prepare('SELECT COUNT(*) as count FROM packets').get() as any;
    const verified = this.db.prepare("SELECT COUNT(*) as count FROM packets WHERE verdict = 'VERIFIED'").get() as any;
    const contradicted = this.db.prepare("SELECT COUNT(*) as count FROM packets WHERE verdict = 'CONTRADICTED'").get() as any;
    const hold = this.db.prepare("SELECT COUNT(*) as count FROM packets WHERE verdict = 'HOLD'").get() as any;
    const sealed = this.db.prepare('SELECT COUNT(*) as count FROM packets WHERE sealed = 1').get() as any;

    return {
      total: total.count,
      verified: verified.count,
      contradicted: contradicted.count,
      hold: hold.count,
      sealed: sealed.count,
    };
  }
}
