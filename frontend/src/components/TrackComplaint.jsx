import React, { useState, useRef } from 'react';
import { useWallet } from '../context/WalletContext';
import { getComplaintContract, getActiveContractAddress } from '../utils/ethereum';
import { STATUS_MAP, formatTimestamp } from '../utils/formatters';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  MessageSquare,
  FileQuestion,
  HelpCircle,
  Tag,
  Calendar
} from 'lucide-react';

export default function TrackComplaint({ initialId = '' }) {
  const { queryProvider, chainId } = useWallet();

  const [queryId, setQueryId] = useState(initialId);
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');
  const isMountedRef = useRef(true);

  const handleTrack = async (e) => {
    if (e) e.preventDefault();

    const cleanId = queryId.toString().trim();
    if (!cleanId || isNaN(cleanId) || Number(cleanId) <= 0) {
      setError('Please enter a valid numeric Complaint ID (e.g. 1, 2, 3).');
      setComplaint(null);
      setNotFound(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      setNotFound(false);
      setComplaint(null);

      const contractAddress = getActiveContractAddress(chainId);
      if (!contractAddress || !queryProvider) {
        setError('Cannot connect to contract on this network. Please switch to Hardhat Localhost (Chain ID 31337).');
        setLoading(false);
        return;
      }

      const contract = getComplaintContract(queryProvider, chainId);
      const totalCount = await contract.complaintCount();

      if (BigInt(cleanId) > totalCount) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const data = await contract.getComplaint(BigInt(cleanId));

      setComplaint({
        id: data.id.toString(),
        category: data.category,
        description: data.description,
        timestamp: data.timestamp,
        status: Number(data.status),
        adminResponse: data.adminResponse,
      });
    } catch (err) {
      console.warn('Tracking query error:', err);
      if (err.message && err.message.includes('does not exist')) {
        setNotFound(true);
      } else {
        setError('Failed to fetch complaint from blockchain: ' + (err.reason || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  // Steps for timeline progression
  const statusSteps = [
    { key: 0, label: 'Submitted', desc: 'Complaint recorded' },
    { key: 1, label: 'Under Review', desc: 'Investigation in progress' },
    {
      key: complaint && complaint.status === 3 ? 3 : 2,
      label: complaint && complaint.status === 3 ? 'Rejected' : 'Resolved',
      desc: complaint && complaint.status === 3 ? 'Complaint closed' : 'Issue resolved',
    },
  ];

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto' }}>
      {/* Search Bar Panel */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '0.5rem', color: '#ffffff' }}>
          Track Complaint by ID
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Query live on-chain status, audit history, and official administrative replies (FR-3.1).
        </p>

        <form onSubmit={handleTrack} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
            <input
              type="number"
              min="1"
              className="input-control"
              placeholder="Enter Complaint ID (e.g. 1)"
              value={queryId}
              onChange={(e) => setQueryId(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
            <Search
              size={18}
              color="var(--text-subtle)"
              style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !queryId}
            className="btn-primary"
            style={{ padding: '0.75rem 1.75rem' }}
          >
            {loading ? 'Querying Ledger...' : 'Track Status'}
          </button>
        </form>

        {error && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            fontSize: '0.85rem',
          }}>
            {error}
          </div>
        )}
      </div>

      {/* ID Not Found Notice (FR-3.3) */}
      {notFound && (
        <div
          className="glass-panel"
          style={{
            padding: '2rem',
            textAlign: 'center',
            borderColor: 'rgba(239, 68, 68, 0.3)',
            background: 'rgba(239, 68, 68, 0.05)',
          }}
        >
          <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <FileQuestion size={28} color="#f87171" />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#ffffff', marginBottom: '0.5rem' }}>
            Complaint ID #{queryId} Not Found (FR-3.3)
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '480px', margin: '0 auto' }}>
            No complaint has been recorded with this ID on the connected network. Double-check your number or verify if you are connected to the correct network.
          </p>
        </div>
      )}

      {/* Complaint Details Card */}
      {complaint && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          {/* Header Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.75rem', fontWeight: '800', fontFamily: 'JetBrains Mono', color: '#818cf8' }}>
                  #{complaint.id}
                </span>
                <span className={`badge ${STATUS_MAP[complaint.status]?.class}`}>
                  {STATUS_MAP[complaint.status]?.label}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Tag size={14} color="#818cf8" />
                  <strong>Category:</strong> {complaint.category}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Calendar size={14} color="#818cf8" />
                  <strong>Submitted:</strong> {formatTimestamp(complaint.timestamp)}
                </span>
              </div>
            </div>
          </div>

          {/* Timeline Lifecycle Visualization (FR-3.2) */}
          <div style={{ marginBottom: '2rem', padding: '1.25rem', borderRadius: '0.75rem', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#ffffff', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Lifecycle Status Progression (SRS 5.2)
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', position: 'relative' }}>
              {statusSteps.map((step, index) => {
                const isPassed = complaint.status >= step.key;
                const isCurrent = complaint.status === step.key;

                return (
                  <div
                    key={index}
                    style={{
                      padding: '0.85rem',
                      borderRadius: '0.5rem',
                      background: isCurrent
                        ? 'rgba(99, 102, 241, 0.2)'
                        : isPassed
                        ? 'rgba(16, 185, 129, 0.1)'
                        : 'rgba(51, 65, 85, 0.2)',
                      border: isCurrent
                        ? '1px solid #6366f1'
                        : isPassed
                        ? '1px solid rgba(16, 185, 129, 0.3)'
                        : '1px solid rgba(148, 163, 184, 0.1)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{
                      fontWeight: '700',
                      fontSize: '0.9rem',
                      color: isCurrent ? '#a5b4fc' : isPassed ? '#34d399' : 'var(--text-subtle)',
                      marginBottom: '0.2rem',
                    }}>
                      {step.label}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                      {step.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Complaint Text Section */}
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#ffffff', marginBottom: '0.5rem' }}>
              Original Immutable Complaint Text
            </h4>
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid var(--border-color)',
                borderRadius: '0.75rem',
                padding: '1.25rem',
                fontSize: '0.95rem',
                lineHeight: '1.7',
                color: 'var(--text-main)',
                whiteSpace: 'pre-wrap',
              }}
            >
              {complaint.description}
            </div>
          </div>

          {/* Admin Response Section (FR-3.1, FR-5.4) */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <ShieldCheck size={18} color="#34d399" />
              <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#ffffff' }}>
                Official Administrative Response
              </h4>
            </div>

            {complaint.adminResponse ? (
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.8) 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                  fontSize: '0.95rem',
                  lineHeight: '1.7',
                  color: '#e2e8f0',
                  whiteSpace: 'pre-wrap',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
                  ✓ Signed by Verified Admin Wallet on Blockchain
                </div>
                {complaint.adminResponse}
              </div>
            ) : (
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.5)',
                  border: '1px dashed var(--border-color)',
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                  color: 'var(--text-subtle)',
                  fontSize: '0.9rem',
                  fontStyle: 'italic',
                }}
              >
                No response has been attached by the administration yet. The issue is awaiting evaluation.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
