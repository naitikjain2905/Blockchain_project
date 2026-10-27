import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useWallet } from '../context/WalletContext';
import { getComplaintContract, getActiveContractAddress } from '../utils/ethereum';
import {
  FileText,
  Clock,
  Eye,
  CheckCircle,
  XCircle,
  RefreshCw,
  ShieldCheck,
  Lock,
  Cpu,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function StatsOverview({ setActiveTab }) {
  const { queryProvider, chainId } = useWallet();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    underReview: 0,
    resolved: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(false);
  const [latestBlock, setLatestBlock] = useState(null);
  const isMountedRef = useRef(true);

  const fetchStats = useCallback(async () => {
    try {
      if (isMountedRef.current) setLoading(true);
      const contractAddress = getActiveContractAddress(chainId);
      if (!contractAddress || !queryProvider) {
        if (isMountedRef.current) setLoading(false);
        return;
      }

      const contract = getComplaintContract(queryProvider, chainId);
      const result = await contract.getStats();
      const currentBlock = await queryProvider.getBlockNumber();

      if (isMountedRef.current) {
        setStats({
          total: Number(result.total),
          pending: Number(result.pending),
          underReview: Number(result.underReview),
          resolved: Number(result.resolved),
          rejected: Number(result.rejected),
        });
        setLatestBlock(currentBlock);
      }
    } catch (err) {
      console.warn('On-chain stats query:', err.message);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [queryProvider, chainId]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchStats();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchStats]);

  const statCards = [
    {
      title: 'Total Complaints',
      value: stats.total,
      icon: <Layers size={22} color="#818cf8" />,
      color: '#818cf8',
      bg: 'rgba(99, 102, 241, 0.1)',
      border: 'rgba(99, 102, 241, 0.25)',
      description: 'Recorded on Ethereum ledger',
    },
    {
      title: 'Submitted (Pending)',
      value: stats.pending,
      icon: <Clock size={22} color="#fbbf24" />,
      color: '#fbbf24',
      bg: 'rgba(245, 158, 11, 0.1)',
      border: 'rgba(245, 158, 11, 0.25)',
      description: 'Awaiting authority review',
    },
    {
      title: 'Under Review',
      value: stats.underReview,
      icon: <Eye size={22} color="#22d3ee" />,
      color: '#22d3ee',
      bg: 'rgba(6, 182, 212, 0.1)',
      border: 'rgba(6, 182, 212, 0.25)',
      description: 'Investigation in progress',
    },
    {
      title: 'Resolved',
      value: stats.resolved,
      icon: <CheckCircle size={22} color="#34d399" />,
      color: '#34d399',
      bg: 'rgba(16, 185, 129, 0.1)',
      border: 'rgba(16, 185, 129, 0.25)',
      description: 'Remedial actions finalized',
    },
    {
      title: 'Rejected',
      value: stats.rejected,
      icon: <XCircle size={22} color="#f87171" />,
      color: '#f87171',
      bg: 'rgba(239, 68, 68, 0.1)',
      border: 'rgba(239, 68, 68, 0.25)',
      description: 'Invalid or dismissed submissions',
    },
  ];

  return (
    <div>
      {/* Hero Banner */}
      <section style={{
        padding: '3rem 2rem',
        borderRadius: '1.25rem',
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)',
        border: '1px solid var(--border-color)',
        marginBottom: '2.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ maxWidth: '750px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.85rem',
            borderRadius: '9999px',
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            color: '#a5b4fc',
            fontSize: '0.85rem',
            fontWeight: '600',
            marginBottom: '1rem',
          }}>
            <ShieldCheck size={16} />
            <span>IEEE 830 Specification Compliant · Serverless dApp</span>
          </div>

          <h1 style={{
            fontSize: '2.6rem',
            fontWeight: '800',
            lineHeight: '1.2',
            letterSpacing: '-0.03em',
            marginBottom: '1rem',
            color: '#ffffff',
          }}>
            Anonymous Grievance Redressal Powered by <span style={{ color: '#818cf8' }}>Blockchain</span>.
          </h1>

          <p style={{
            fontSize: '1.05rem',
            color: 'var(--text-muted)',
            lineHeight: '1.7',
            marginBottom: '2rem',
          }}>
            A decentralized, censorship-resistant platform allowing students to voice academic, hostel, and institutional concerns without revealing identity. Built with zero databases — every report and official response is permanently committed to the immutable Ethereum ledger.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('submit')}
              className="btn-primary"
              style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}
            >
              <span>Submit Anonymous Complaint</span>
              <ArrowRight size={18} />
            </button>
            <button
              onClick={() => setActiveTab('track')}
              className="btn-secondary"
              style={{ padding: '0.85rem 1.5rem', fontSize: '1rem' }}
            >
              <span>Track Complaint Status</span>
            </button>
          </div>
        </div>
      </section>

      {/* Metrics Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#ffffff' }}>
            Live On-Chain Statistics
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Aggregated metrics queried directly from the smart contract via <code className="font-mono">getStats()</code>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {latestBlock && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }} className="font-mono">
              Block #{latestBlock}
            </span>
          )}
          <button
            onClick={fetchStats}
            disabled={loading}
            className="btn-secondary"
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
            title="Refresh statistics"
          >
            <RefreshCw size={14} className={loading ? 'pulse-dot' : ''} />
            <span>{loading ? 'Fetching...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '1rem',
        marginBottom: '3rem',
      }}>
        {statCards.map((card, idx) => (
          <div
            key={idx}
            className="glass-panel"
            style={{
              padding: '1.25rem',
              background: card.bg,
              borderColor: card.border,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                {card.title}
              </span>
              {card.icon}
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: '800', color: card.color, lineHeight: '1.1', marginBottom: '0.25rem' }}>
              {card.value}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
              {card.description}
            </div>
          </div>
        ))}
      </div>

      {/* Three Pillars Architecture Callouts */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem',
      }}>
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ width: '2.75rem', height: '2.75rem', borderRadius: '0.75rem', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <Lock size={22} color="#818cf8" />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.5rem', color: '#ffffff' }}>
            No Database · Zero Identity Leak
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
            No names, emails, student IDs, or IP logs are ever stored. The contract does not even record the sender address in storage, achieving true pseudonymity.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ width: '2.75rem', height: '2.75rem', borderRadius: '0.75rem', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <ShieldCheck size={22} color="#34d399" />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.5rem', color: '#ffffff' }}>
            Tamper-Proof &amp; Permanent
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
            Smart contract rule SC-2 strictly forbids deleting or editing complaint text. Once mined, no university administrator or third party can alter your report.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ width: '2.75rem', height: '2.75rem', borderRadius: '0.75rem', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <Cpu size={22} color="#22d3ee" />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.5rem', color: '#ffffff' }}>
            Cryptographic Accountability
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
            Only the verified admin wallet can update status and publish responses. Every status change fires an on-chain event verifiable on Etherscan.
          </p>
        </div>
      </div>
    </div>
  );
}
