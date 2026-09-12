'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SealButton({ packetId }: { packetId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [humanName, setHumanName] = useState('');

  const handleSeal = async () => {
    if (!humanName.trim()) {
      alert('Please enter your name');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/packet/${packetId}/seal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ humanName: humanName.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to seal packet');
      }

      router.refresh();
      setShowPrompt(false);
    } catch (err: any) {
      alert(err.message);
      setLoading(false);
    }
  };

  if (!showPrompt) {
    return (
      <button 
        className="button" 
        style={{ background: '#17a2b8' }}
        onClick={() => setShowPrompt(true)}
      >
        Apply Human Seal
      </button>
    );
  }

  return (
    <div style={{ 
      background: '#d1ecf1', 
      padding: '1rem', 
      borderRadius: '4px',
      border: '1px solid #bee5eb'
    }}>
      <h4 style={{ marginBottom: '0.5rem', color: '#0c5460' }}>Apply Human Seal</h4>
      <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#0c5460' }}>
        Only HOLD verdicts can be sealed. Enter your name to apply the seal:
      </p>
      <input
        type="text"
        placeholder="Your name"
        value={humanName}
        onChange={(e) => setHumanName(e.target.value)}
        style={{ 
          width: '100%', 
          padding: '0.5rem', 
          marginBottom: '1rem',
          border: '1px solid #bee5eb',
          borderRadius: '4px'
        }}
      />
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button 
          className="button" 
          style={{ background: '#17a2b8' }}
          onClick={handleSeal}
          disabled={loading}
        >
          {loading ? 'Sealing...' : 'Seal Packet'}
        </button>
        <button 
          className="button" 
          style={{ background: '#6c757d' }}
          onClick={() => setShowPrompt(false)}
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
