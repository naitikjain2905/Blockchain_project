import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useWallet } from '../context/WalletContext';
import {
  getComplaintContract,
  getActiveContractAddress,
  getTransactionExplorerUrl,
  formatAddress
} from '../utils/ethereum';
import { STATUS_MAP, formatTimestamp } from '../utils/formatters';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Edit3,
  Send,
  Loader2,
  ExternalLink,
  Lock,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';

export default function AdminPanel() {
  const { account, signer, chainId, isAdmin, adminAddress, connectWallet } = useWallet();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [newStatus, setNewStatus] = useState('1'); // 1: UnderReview, 2: Resolved, 3: Rejected
  const [responseText, setResponseText] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [updateError, setUpdateError] = useState('');
  const [txHash, setTxHash] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const isMountedRef = useRef(true);

  const fetchComplaints = useCallback(async () => {
    try {
      if (isMountedRef.current) setLoading(true);
      const contractAddress = getActiveContractAddress(chainId);
      if (!contractAddress || !signer) {
        if (isMountedRef.current) setLoading(false);
        return;
      }

      const contract = getComplaintContract(signer, chainId);
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
      console.warn('Admin panel complaints fetch:', err.message);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [signer, chainId]);

  useEffect(() => {
    isMountedRef.current = true;
    if (isAdmin) {
      fetchComplaints();
    }
    return () => {
      isMountedRef.current = false;
    };
  }, [isAdmin, fetchComplaints]);

  const handleOpenActionModal = (complaint) => {
    setSelectedComplaint(complaint);
    setNewStatus(complaint.status === 0 ? '1' : String(complaint.status));
    setResponseText(complaint.adminResponse || '');
    setUpdateError('');
    setUpdateSuccess('');
    setTxHash('');
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();

    if (!selectedComplaint) return;

    if (!responseText.trim()) {
      setUpdateError('Please enter an official response explaining the resolution or decision.');
      return;
    }

    try {
      setIsUpdating(true);
      setUpdateError('');
      setUpdateSuccess('');
      setTxHash('');

      const contract = getComplaintContract(signer, chainId);

      const targetId = BigInt(selectedComplaint.id);
      const targetStatus = Number(newStatus);

      // Call updateStatus on-chain
      const tx = await contract.updateStatus(targetId, targetStatus, responseText.trim());
      if (isMountedRef.current) {
        setTxHash(tx.hash);
      }

      await tx.wait(1);

      if (isMountedRef.current) {
        setUpdateSuccess(`Complaint #${selectedComplaint.id} status successfully updated to ${STATUS_MAP[targetStatus]?.label}!`);
        setIsUpdating(false);
      }

      fetchComplaints();
    } catch (err) {
      console.error('Update status error:', err);
      if (isMountedRef.current) {
        setIsUpdating(false);
        const msg = err.message || '';
        if (err.code === 'ACTION_REJECTED' || err.code === 4001) {
          setUpdateError('Transaction request was rejected in MetaMask.');
        } else if (msg.includes('insufficient funds') || err.code === 'INSUFFICIENT_FUNDS') {
          setUpdateError('Insufficient funds: Your admin wallet has 0 ETH to pay for transaction gas.');
        } else if (msg.includes('nonce') || msg.includes('Nonce')) {
          setUpdateError('Nonce mismatch: Please clear MetaMask activity cache (MetaMask -> Settings -> Advanced -> Clear activity tab data).');
        } else {
          setUpdateError(err.reason || err.shortMessage || err.message || 'Transaction reverted on blockchain.');
        }
      }
    }
  };

  // If user is not connected or not the admin
  if (!account || !isAdmin) {
    return (
      <div style={{ maxWidth: '720px', margin: '2rem auto' }}>
        <div
          className="glass-panel"
          style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            borderColor: 'rgba(239, 68, 68, 0.3)',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(15, 23, 42, 0.95) 100%)',
          }}
        >
          <div style={{ width: '4rem', height: '4rem', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <Lock size={32} color="#f87171" />
          </div>

          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#ffffff', marginBottom: '0.75rem' }}>
            Restricted Authority Access (SRS FR-5.1 &amp; SC-1)
          </h2>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem', maxWidth: '520px', margin: '0 auto 1.5rem' }}>
            Only the contract deployer / designated authority wallet is authorized to review grievances, update complaint statuses, and attach binding administrative replies.
          </p>

          <div style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid var(--border-color)',
            borderRadius: '0.75rem',
            padding: '1rem',
            marginBottom: '1.75rem',
            display: 'inline-block',
            textAlign: 'left',
          }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginBottom: '0.25rem' }}>
              Designated Admin Address:
            </div>
            <div className="font-mono" style={{ fontSize: '0.9rem', color: '#818cf8', fontWeight: '600' }}>
              {adminAddress ? adminAddress : 'Deploy contract to view registered admin'}
            </div>
            {account && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#f87171' }}>
                Your Connected Address: <span className="font-mono">{account}</span> (Unauthorized)
              </div>
            )}
          </div>

          <div>
            {!account ? (
              <button onClick={connectWallet} className="btn-primary" style={{ padding: '0.75rem 1.75rem' }}>
                Connect Authority Wallet
              </button>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-subtle)' }}>
                Please switch to the admin wallet in your MetaMask extension to access administrative tools.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Filter complaints
  const filteredList = statusFilter === 'ALL'
    ? complaints
    : complaints.filter((c) => c.status === Number(statusFilter));

  const explorerUrl = getTransactionExplorerUrl(txHash, chainId);

  return (
    <div>
      {/* Admin Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.6rem', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={22} color="#34d399" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#ffffff' }}>
                Authority Grievance Management Panel
              </h2>
              <span className="badge badge-resolved" style={{ fontSize: '0.7rem' }}>
                Verified Admin (FR-5.1)
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Logged in as <span className="font-mono" style={{ color: '#818cf8' }}>{formatAddress(account)}</span> · Direct smart contract state control
            </p>
          </div>
        </div>

        <button
          onClick={fetchComplaints}
          disabled={loading}
          className="btn-secondary"
          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
        >
          <RefreshCw size={14} className={loading ? 'pulse-dot' : ''} />
          <span>{loading ? 'Refreshing...' : 'Refresh List'}</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { id: 'ALL', label: `All Complaints (${complaints.length})` },
          { id: '0', label: 'Submitted' },
          { id: '1', label: 'Under Review' },
          { id: '2', label: 'Resolved' },
          { id: '3', label: 'Rejected' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            style={{
              background: statusFilter === tab.id ? 'var(--primary-light)' : 'var(--bg-secondary)',
              color: statusFilter === tab.id ? '#ffffff' : 'var(--text-muted)',
              border: statusFilter === tab.id ? '1px solid #6366f1' : '1px solid var(--border-color)',
              padding: '0.45rem 0.9rem',
              borderRadius: '0.5rem',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Complaints Table / List */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(15, 23, 42, 0.6)' }}>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600' }}>ID</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600' }}>Category</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600' }}>Description</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600' }}>Status</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600' }}>Date</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No complaints match the current filter.
                </td>
              </tr>
            ) : (
              filteredList.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s ease' }}>
                  <td style={{ padding: '1rem', fontWeight: '700', fontFamily: 'JetBrains Mono', color: '#818cf8' }}>
                    #{item.id}
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-main)', fontWeight: '500' }}>
                    {item.category}
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)', maxWidth: '340px' }}>
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.description}
                    </div>
                    {item.adminResponse && (
                      <div style={{ fontSize: '0.75rem', color: '#34d399', marginTop: '0.25rem' }}>
                        ✓ Responded
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span className={`badge ${STATUS_MAP[item.status]?.class}`}>
                      {STATUS_MAP[item.status]?.label}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-subtle)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    {formatTimestamp(item.timestamp)}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button
                      onClick={() => handleOpenActionModal(item)}
                      className="btn-primary"
                      style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
                    >
                      <Edit3 size={14} />
                      <span>Respond</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Action / Response Modal */}
      {selectedComplaint && (
        <div className="modal-backdrop">
          <div
            className="glass-panel"
            style={{
              maxWidth: '620px',
              width: '100%',
              padding: '2rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-hover)',
              position: 'relative',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#ffffff' }}>
                  Update Complaint #{selectedComplaint.id}
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Category: {selectedComplaint.category}
                </span>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            {/* Original Complaint Text (SC-2: Non-editable) */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', textTransform: 'uppercase', marginBottom: '0.35rem', fontWeight: '600' }}>
                Immutable Grievance Text (SC-2: Protected against modification)
              </div>
              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                padding: '0.85rem 1rem',
                fontSize: '0.9rem',
                color: 'var(--text-main)',
                maxHeight: '120px',
                overflowY: 'auto',
              }}>
                {selectedComplaint.description}
              </div>
            </div>

            <form onSubmit={handleUpdateStatus}>
              {/* Status Selector (FR-5.3) */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: '#ffffff' }}>
                  New Lifecycle Status (FR-5.3)
                </label>
                <select
                  className="select-control"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  disabled={isUpdating}
                >
                  <option value="1">Under Review (Investigation opened)</option>
                  <option value="2">Resolved (Remedial action taken)</option>
                  <option value="3">Rejected (Invalid or out of scope)</option>
                </select>
              </div>

              {/* Admin Response (FR-5.4) */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: '#ffffff' }}>
                  Official Response / Action Taken (FR-5.4)
                </label>
                <textarea
                  className="textarea-control"
                  rows={4}
                  placeholder="Provide detailed, professional feedback on actions taken by the administration..."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  disabled={isUpdating}
                  required
                />
              </div>

              {/* Success Alert */}
              {updateSuccess && (
                <div style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#34d399',
                  marginBottom: '1rem',
                  fontSize: '0.85rem',
                }}>
                  {updateSuccess}
                </div>
              )}

              {/* Error Alert */}
              {updateError && (
                <div style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  marginBottom: '1rem',
                  fontSize: '0.85rem',
                }}>
                  {updateError}
                </div>
              )}

              {/* Transaction Hash */}
              {txHash && (
                <div style={{ marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>Tx: </span>
                  <span className="font-mono">{txHash.substring(0, 16)}...</span>
                  {explorerUrl && (
                    <a href={explorerUrl} target="_blank" rel="noreferrer" style={{ marginLeft: '0.5rem', color: '#818cf8' }}>
                      View on Etherscan
                    </a>
                  )}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  disabled={isUpdating}
                  className="btn-secondary"
                  style={{ padding: '0.65rem 1.25rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating || !responseText.trim()}
                  className="btn-primary"
                  style={{ padding: '0.65rem 1.5rem' }}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 size={16} className="pulse-dot" />
                      <span>Signing &amp; Mining...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>Commit On-Chain</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
