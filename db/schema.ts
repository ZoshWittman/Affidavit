import Database from 'better-sqlite3';
import path from 'path';

export function initializeDatabase(dbPath?: string): Database.Database {
  const db = new Database(dbPath || path.join(process.cwd(), 'affidavit.db'));
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS packets (
      id TEXT PRIMARY KEY,
      report_id TEXT NOT NULL,
      report_title TEXT NOT NULL,
      report_content TEXT NOT NULL,
      report_claims TEXT NOT NULL,
      report_submitted_at INTEGER NOT NULL,
      verdict TEXT NOT NULL,
      lie_profile TEXT,
      sealed INTEGER NOT NULL DEFAULT 0,
      human_sealed_by TEXT,
      human_sealed_at INTEGER,
      created_at INTEGER NOT NULL,
      adjudicated_at INTEGER,
      UNIQUE(report_id)
    );

    CREATE TABLE IF NOT EXISTS evidence (
      id TEXT PRIMARY KEY,
      packet_id TEXT NOT NULL,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      hash TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (packet_id) REFERENCES packets(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_packets_verdict ON packets(verdict);
    CREATE INDEX IF NOT EXISTS idx_packets_sealed ON packets(sealed);
    CREATE INDEX IF NOT EXISTS idx_packets_created_at ON packets(created_at);
    CREATE INDEX IF NOT EXISTS idx_evidence_packet_id ON evidence(packet_id);
    CREATE INDEX IF NOT EXISTS idx_evidence_hash ON evidence(hash);
  `);

  return db;
}

export function getDatabase(): Database.Database {
  return initializeDatabase();
}
