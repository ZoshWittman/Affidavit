import { PacketManager } from '@/lib/packet';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import SealButton from './SealButton';

export default async function PacketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const manager = new PacketManager();
  const packet = manager.getPacket(id);

  if (!packet) {
    notFound();
  }

  return (
    <>
      <div className="header">
        <h1>Affidavit Packet</h1>
        <p>ID: {packet.id}</p>
      </div>
      <div className="container">
        <div style={{ marginBottom: '1.5rem' }}>
          <Link href="/">
            <button className="button" style={{ background: '#6c757d' }}>
              ← Back to Home
            </button>
          </Link>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ color: '#2c3e50' }}>Verdict</h2>
            <div>
              <span className={`verdict ${packet.verdict.toLowerCase()}`}>
                {packet.verdict}
              </span>
              {packet.sealed && (
                <span className="sealed-badge">SEALED</span>
              )}
            </div>
          </div>
          {packet.sealed && (
            <div style={{ 
              background: '#d1ecf1', 
              padding: '1rem', 
              borderRadius: '4px',
              marginTop: '1rem'
            }}>
              <strong>Human Sealed:</strong> {packet.humanSealedBy} on{' '}
              {new Date(packet.humanSealedAt!).toLocaleString()}
            </div>
          )}
          {packet.verdict === 'HOLD' && !packet.sealed && (
            <div style={{ marginTop: '1rem' }}>
              <SealButton packetId={packet.id} />
            </div>
          )}
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '1rem', color: '#2c3e50' }}>Report</h2>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>
            {packet.report.title}
          </h3>
          <div className="packet-meta" style={{ marginBottom: '1rem' }}>
            Submitted: {new Date(packet.report.submittedAt).toLocaleString()}
          </div>
          <div style={{ 
            whiteSpace: 'pre-wrap', 
            lineHeight: '1.6',
            background: '#f8f9fa',
            padding: '1rem',
            borderRadius: '4px'
          }}>
            {packet.report.content}
          </div>
          <div style={{ marginTop: '1.5rem' }}>
            <h4 style={{ marginBottom: '0.5rem', color: '#2c3e50' }}>Claims</h4>
            <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
              {packet.report.claims.map((claim, i) => (
                <li key={i}>{claim}</li>
              ))}
            </ul>
          </div>
        </div>

        {packet.lieProfile && (
          <div className="lie-profile">
            <h3 style={{ color: '#856404', marginBottom: '1rem' }}>
              Lie Profile Detected
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <div>
                <strong>Total Lies:</strong> {packet.lieProfile.lies.length}
              </div>
              <div>
                <strong>Total Severity:</strong> {packet.lieProfile.totalSeverity}
              </div>
              <div>
                <strong>Blast Radius:</strong> {packet.lieProfile.blastRadius}
              </div>
            </div>
            <h4 style={{ marginBottom: '0.5rem' }}>Lies Detected:</h4>
            <ul className="lie-list">
              {packet.lieProfile.lies.map((lie, i) => (
                <li key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong style={{ textTransform: 'uppercase', fontSize: '0.85rem' }}>
                      {lie.type}
                    </strong>
                    <span style={{ color: '#856404' }}>Severity: {lie.severity}</span>
                  </div>
                  <div style={{ marginTop: '0.25rem' }}>{lie.claim}</div>
                  {lie.evidence && (
                    <div style={{ 
                      marginTop: '0.25rem', 
                      fontSize: '0.85rem', 
                      color: '#666',
                      fontStyle: 'italic'
                    }}>
                      Evidence: {lie.evidence}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="card">
          <h2 style={{ marginBottom: '1rem', color: '#2c3e50' }}>
            Evidence Ledger ({packet.evidenceLedger.length} items)
          </h2>
          {packet.evidenceLedger.map((evidence, i) => (
            <div key={evidence.id} className="evidence-item">
              <div className="evidence-type">{evidence.type}</div>
              <div style={{ 
                fontSize: '0.85rem', 
                color: '#666',
                marginBottom: '0.5rem'
              }}>
                {new Date(evidence.timestamp).toLocaleString()}
              </div>
              <div style={{ 
                whiteSpace: 'pre-wrap', 
                wordBreak: 'break-word',
                marginBottom: '0.5rem'
              }}>
                {evidence.content}
              </div>
              <div style={{ 
                fontSize: '0.75rem', 
                color: '#999',
                fontFamily: 'monospace',
                wordBreak: 'break-all'
              }}>
                SHA-256: {evidence.hash}
              </div>
            </div>
          ))}
        </div>

        <div className="card" style={{ background: '#f8f9fa' }}>
          <h3 style={{ marginBottom: '0.5rem', color: '#2c3e50' }}>Timestamps</h3>
          <div style={{ fontSize: '0.9rem', lineHeight: '1.8' }}>
            <div><strong>Created:</strong> {new Date(packet.createdAt).toLocaleString()}</div>
            {packet.adjudicatedAt && (
              <div><strong>Adjudicated:</strong> {new Date(packet.adjudicatedAt).toLocaleString()}</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
