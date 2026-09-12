'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SubmitPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const claimsText = formData.get('claims') as string;
    const evidenceText = formData.get('evidence') as string;

    const claims = claimsText.split('\n').filter(c => c.trim());
    const evidenceItems = evidenceText.split('\n---\n').filter(e => e.trim());

    try {
      const response = await fetch('/api/packet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report: {
            title,
            content,
            claims,
          },
          evidence: evidenceItems.map((item) => {
            const [type, ...contentParts] = item.split(':');
            return {
              type: type.trim() || 'digest',
              content: contentParts.join(':').trim() || item.trim(),
            };
          }),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit packet');
      }

      const data = await response.json();
      router.push(`/packet/${data.packetId}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <>
      <div className="header">
        <h1>Submit Report for Adjudication</h1>
        <p>Create an Affidavit Packet with your report and evidence</p>
      </div>
      <div className="container">
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Report Title</label>
              <input
                type="text"
                id="title"
                name="title"
                required
                placeholder="e.g., Task Completion Report"
              />
            </div>

            <div className="form-group">
              <label htmlFor="content">Report Content</label>
              <textarea
                id="content"
                name="content"
                required
                placeholder="Describe what was done..."
                rows={8}
              />
            </div>

            <div className="form-group">
              <label htmlFor="claims">Claims (one per line)</label>
              <textarea
                id="claims"
                name="claims"
                required
                placeholder="All tests passed&#10;Database migration completed&#10;API endpoints deployed"
                rows={5}
              />
            </div>

            <div className="form-group">
              <label htmlFor="evidence">
                Evidence (separate items with ---; format: type:content)
              </label>
              <textarea
                id="evidence"
                name="evidence"
                required
                placeholder="tool-io:npm test -- output: all tests passed&#10;---&#10;screenshot:screenshot of deployment dashboard&#10;---&#10;digest:deployment confirmation email received"
                rows={8}
              />
            </div>

            {error && (
              <div style={{ 
                background: '#f8d7da', 
                color: '#721c24', 
                padding: '1rem', 
                borderRadius: '4px',
                marginBottom: '1rem' 
              }}>
                {error}
              </div>
            )}

            <button type="submit" className="button" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit for Adjudication'}
            </button>
          </form>
        </div>

        <div className="card" style={{ background: '#e7f3ff' }}>
          <h3 style={{ marginBottom: '1rem', color: '#2c3e50' }}>How It Works</h3>
          <ol style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
            <li>Submit your report with claims and evidence</li>
            <li>SHA-256 hashes secure the evidence ledger</li>
            <li>Deterministic adjudicators analyze for lies (no LLM)</li>
            <li>Receive verdict: VERIFIED / CONTRADICTED / HOLD</li>
            <li>HOLD verdicts require human seal approval</li>
          </ol>
        </div>
      </div>
    </>
  );
}
