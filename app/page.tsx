import Link from 'next/link';
import { PacketManager } from '@/lib/packet';

export default async function HomePage() {
  const manager = new PacketManager();
  const stats = manager.getStats();
  const packets = manager.listPackets(10);

  return (
    <>
      <div className="header">
        <h1>Affidavit</h1>
        <p>Report-fidelity seal desk for AI agent written reports</p>
      </div>
      <div className="container">
        <div className="stats-grid">
          <div className="stat-card">
            <h3>{stats.total}</h3>
            <p>Total Packets</p>
          </div>
          <div className="stat-card">
            <h3>{stats.verified}</h3>
            <p>Verified</p>
          </div>
          <div className="stat-card">
            <h3>{stats.contradicted}</h3>
            <p>Contradicted</p>
          </div>
          <div className="stat-card">
            <h3>{stats.hold}</h3>
            <p>Hold</p>
          </div>
          <div className="stat-card">
            <h3>{stats.sealed}</h3>
            <p>Sealed</p>
          </div>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '1rem', color: '#2c3e50' }}>Actions</h2>
          <Link href="/submit">
            <button className="button">Submit New Report</button>
          </Link>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '1rem', color: '#2c3e50' }}>Recent Packets</h2>
          <div className="packet-list">
            {packets.length === 0 ? (
              <p style={{ color: '#666' }}>No packets yet. Submit your first report!</p>
            ) : (
              packets.map((packet) => (
                <Link key={packet.id} href={`/packet/${packet.id}`}>
                  <div className="packet-item">
                    <div className="packet-header">
                      <div>
                        <div className="packet-title">{packet.report.title}</div>
                        <div className="packet-meta">
                          {new Date(packet.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <span className={`verdict ${packet.verdict.toLowerCase()}`}>
                          {packet.verdict}
                        </span>
                        {packet.sealed && (
                          <span className="sealed-badge">SEALED</span>
                        )}
                      </div>
                    </div>
                    {packet.lieProfile && (
                      <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                        {packet.lieProfile.lies.length} lie(s) detected • Blast radius: {packet.lieProfile.blastRadius}
                      </div>
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
