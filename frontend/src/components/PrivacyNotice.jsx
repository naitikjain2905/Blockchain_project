import React, { useState } from 'react';
import { ShieldAlert, Info, X } from 'lucide-react';

export default function PrivacyNotice() {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) {
    return (
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={() => setIsDismissed(false)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          <Info size={14} /> Show Privacy & Anonymity Advisory
        </button>
      </div>
    );
  }

  return (
    <aside
      aria-label="Privacy Advisory"
      style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        borderRadius: '0.75rem',
        padding: '1rem 1.25rem',
        marginBottom: '1.5rem',
        position: 'relative',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        <ShieldAlert size={22} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ flex: 1 }}>
          <h4 style={{ color: '#fbbf24', fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.25rem' }}>
            Pseudonymity & Blockchain Anonymity Advisory (SRS FR-1.6 &amp; Section 6.3)
          </h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.5' }}>
            <strong>1. Fresh Wallet Recommended:</strong> Blockchain transactions are publicly verifiable. For complete anonymity, use a fresh MetaMask account that has never been linked to your real identity or student email.
            <br />
            <strong>2. Permanent Ledger:</strong> Once recorded, complaint text cannot be deleted or altered by anyone. Never write names, roll numbers, phone numbers, or identifiable personal information.
          </p>
        </div>
        <button
          onClick={() => setIsDismissed(true)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-subtle)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Dismiss advisory"
        >
          <X size={16} />
        </button>
      </div>
    </aside>
  );
}

