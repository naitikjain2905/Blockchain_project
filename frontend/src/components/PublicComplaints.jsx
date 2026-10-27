import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useWallet } from '../context/WalletContext';
import { getComplaintContract, getActiveContractAddress } from '../utils/ethereum';
import { STATUS_MAP, COMPLAINT_CATEGORIES, formatTimestamp } from '../utils/formatters';
import {
  ListFilter,
  Search,
  RefreshCw,
  Tag,
  Calendar,
  Layers,
  ChevronDown
} from 'lucide-react';

export default function PublicComplaints({ onSelectComplaint }) {
  const { queryProvider, chainId } = useWallet();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const isMountedRef = useRef(true);

  const fetchComplaints = useCallback(async () => {
    try {
      if (isMountedRef.current) setLoading(true);
      const contractAddress = getActiveContractAddress(chainId);
      if (!contractAddress || !queryProvider) {
        if (isMountedRef.current) setLoading(false);
        return;
      }

      const contract = getComplaintContract(queryProvider, chainId);
      const data = await contract.getAllComplaints();

      const formatted = data.map((item) => ({
        id: item.id.toString(),
        category: item.category,
        description: item.description,
        timestamp: item.timestamp,
        status: Number(item.status),
        adminResponse: item.adminResponse,
      }));

      formatted.reverse(); // Newest first
      if (isMountedRef.current) {
        setComplaints(formatted);
      }
    } catch (err) {
      console.warn('Public complaints query:', err.message);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [queryProvider, chainId]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchComplaints();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchComplaints]);

  // Filter complaints based on status, category, and search query
  const filteredComplaints = useMemo(() => {
    return complaints.filter((item) => {
      if (selectedStatus !== 'ALL' && item.status !== Number(selectedStatus)) {
        return false;
      }
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesId = item.id.includes(query);
        const matchesCategory = item.category.toLowerCase().includes(query);
        const matchesDesc = item.description.toLowerCase().includes(query);
        return matchesId || matchesCategory || matchesDesc;
      }
      return true;
    });
  }, [complaints, selectedStatus, selectedCategory, searchQuery]);

  return (
    <div>
      {/* Feed Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#ffffff' }}>
            Public Complaint Ledger (FR-4.1)
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Transparent on-chain repository. <em>Note: Submitter addresses are strictly omitted to safeguard student privacy (FR-4.3).</em>
          </p>
        </div>

        <button
          onClick={fetchComplaints}
          disabled={loading}
          className="btn-secondary"
          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
        >
          <RefreshCw size={14} className={loading ? 'pulse-dot' : ''} />
          <span>{loading ? 'Refreshing...' : 'Refresh Feed'}</span>
        </button>
      </div>

      {/* Filter and Search Controls (FR-4.2) */}
      <div
        className="glass-panel"
        style={{
          padding: '1.25rem',
          marginBottom: '2rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          alignItems: 'center',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            className="input-control"
            placeholder="Search by ID or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
          <Search
            size={16}
            color="var(--text-subtle)"
            style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }}
          />
        </div>

        {/* Status Filter */}
        <div>
          <select
            className="select-control"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="0">Submitted</option>
            <option value="1">Under Review</option>
            <option value="2">Resolved</option>
            <option value="3">Rejected</option>
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <select
            className="select-control"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            {COMPLAINT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Complaints List */}
      {loading && complaints.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} className="pulse-dot" style={{ margin: '0 auto 1rem' }} />
          <p>Querying smart contract on blockchain...</p>
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Layers size={32} color="var(--text-subtle)" style={{ margin: '0 auto 1rem' }} />
          <p style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' }}>No complaints found</p>
          <p style={{ fontSize: '0.85rem' }}>Try adjusting your search criteria or submit the first complaint.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredComplaints.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <div
                key={item.id}
                className="glass-panel"
                style={{
                  padding: '1.5rem',
                  cursor: 'pointer',
                  borderLeft: `4px solid ${
                    item.status === 2
                      ? '#10b981'
                      : item.status === 1
                      ? '#06b6d4'
                      : item.status === 3
                      ? '#ef4444'
                      : '#f59e0b'
                  }`,
                }}
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
              >
                {/* Header Line */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: '800', fontFamily: 'JetBrains Mono', color: '#818cf8' }}>
                      #{item.id}
                    </span>
                    <span className={`badge ${STATUS_MAP[item.status]?.class}`}>
                      {STATUS_MAP[item.status]?.label}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      <Tag size={13} /> {item.category}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Calendar size={13} /> {formatTimestamp(item.timestamp)}
                    </span>
                    <ChevronDown
                      size={18}
                      style={{
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                      }}
                    />
                  </div>
                </div>

                {/* Complaint Text Preview / Full */}
                <p style={{
                  fontSize: '0.95rem',
                  lineHeight: '1.6',
                  color: 'var(--text-main)',
                  marginBottom: item.adminResponse ? '1rem' : '0',
                }}>
                  {isExpanded ? item.description : (
                    item.description.length > 220
                      ? `${item.description.substring(0, 220)}... (click to expand)`
                      : item.description
                  )}
                </p>

                {/* Admin Response Preview if Available */}
                {item.adminResponse && (
                  <div style={{
                    marginTop: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem',
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    fontSize: '0.85rem',
                    color: '#d1fae5',
                  }}>
                    <strong style={{ color: '#34d399' }}>Official Response: </strong>
                    {isExpanded ? item.adminResponse : (
                      item.adminResponse.length > 150
                        ? `${item.adminResponse.substring(0, 150)}...`
                        : item.adminResponse
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
