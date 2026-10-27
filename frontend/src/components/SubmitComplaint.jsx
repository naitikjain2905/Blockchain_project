import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { getComplaintContract, getTransactionExplorerUrl } from '../utils/ethereum';
import { COMPLAINT_CATEGORIES } from '../utils/formatters';
import {
  Send,
  AlertTriangle,
  CheckCircle,
  Copy,
  ExternalLink,
  Shield,
  Loader2,
  FileText,
  AlertCircle,
  RefreshCw,
  Wallet
} from 'lucide-react';

export default function SubmitComplaint({ onSubmissionSuccess }) {
  const {
    account,
    signer,
    chainId,
    balance,
    isContractReady,
    isSupportedNetwork,
    networkName,
    connectWallet,
    switchNetwork,
  } = useWallet();

  const [category, setCategory] = useState(COMPLAINT_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(''); // 'signing', 'mining', 'confirmed', 'failed'
  const [txHash, setTxHash] = useState('');
  const [confirmedId, setConfirmedId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const MAX_CHARS = 2000;
  const remainingChars = MAX_CHARS - description.length;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!account || !signer) {
      await connectWallet();
      return;
    }

    if (!isContractReady) {
      setErrorMessage(`Smart contract is not available on ${networkName}. Please switch your network to Hardhat Localhost (Chain ID 31337).`);
      return;
    }

    if (!description.trim()) {
      setErrorMessage('Complaint description cannot be empty.');
      return;
    }

    if (description.length > MAX_CHARS) {
      setErrorMessage(`Description exceeds maximum allowed limit of ${MAX_CHARS} characters.`);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      setSubmissionStatus('signing');

      const contract = getComplaintContract(signer, chainId);

      // Submit transaction to the blockchain
      const tx = await contract.submitComplaint(category, description.trim());
      setTxHash(tx.hash);
      setSubmissionStatus('mining');

      // Wait for 1 confirmation
      const receipt = await tx.wait(1);

      // Extract complaint ID from ComplaintSubmitted event
      let generatedId = null;
      if (receipt && receipt.logs) {
        for (const log of receipt.logs) {
          try {
            const parsed = contract.interface.parseLog(log);
            if (parsed && parsed.name === 'ComplaintSubmitted') {
              generatedId = parsed.args.id.toString();
              break;
            }
          } catch {
            // Skip logs that do not belong to ComplaintSubmitted
          }
        }
      }

      setConfirmedId(generatedId);
      setSubmissionStatus('confirmed');
      setDescription('');

      if (onSubmissionSuccess) {
        onSubmissionSuccess(generatedId);
      }
    } catch (err) {
      console.error('Submission failed:', err);
      setSubmissionStatus('failed');

      const msg = err.message || '';
      if (err.code === 'ACTION_REJECTED' || err.code === 4001) {
        setErrorMessage('Transaction request was rejected in your MetaMask wallet.');
      } else if (msg.includes('insufficient funds') || err.code === 'INSUFFICIENT_FUNDS') {
        setErrorMessage('Insufficient funds: Your connected wallet has 0 ETH. If testing locally, import Account #0 or #1 from Hardhat (pre-funded with 10,000 ETH).');
      } else if (msg.includes('could not decode result data') || msg.includes('missing revert data')) {
        setErrorMessage('Contract call failed: The contract is not deployed on this network. Please switch to Hardhat Localhost (Chain ID 31337).');
      } else if (msg.includes('nonce') || msg.includes('Nonce')) {
        setErrorMessage('MetaMask transaction nonce desync: Please open MetaMask -> Settings -> Advanced -> Clear activity tab data, then try again.');
      } else {
        setErrorMessage(err.reason || err.shortMessage || err.message || 'Transaction reverted on-chain.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyIdToClipboard = () => {
    if (confirmedId) {
      navigator.clipboard.writeText(confirmedId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const explorerUrl = getTransactionExplorerUrl(txHash, chainId);

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto' }}>
      {/* Network / Contract Not Ready Banner */}
      {account && !isContractReady && (
        <div
          className="glass-panel"
          style={{
            padding: '1.25rem 1.5rem',
            background: 'rgba(239, 68, 68, 0.12)',
            borderColor: 'rgba(239, 68, 68, 0.35)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertCircle size={24} color="#f87171" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: '700', color: '#fca5a5', fontSize: '0.95rem' }}>
                Network Compatibility Notice: Contract Not Found on {networkName}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Your wallet is connected to an unsupported network or a network without a deployed contract. Switch to Localhost to interact directly.
              </div>
            </div>
          </div>

          <button
            onClick={() => switchNetwork(31337)}
            className="btn-primary"
            style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', background: '#dc2626' }}
          >
            Switch to Hardhat Localhost (1-Click)
          </button>
        </div>
      )}

      {/* Zero Balance Warning */}
      {account && isContractReady && Number(balance) === 0 && (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: '0.75rem',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
          }}
        >
          <Wallet size={20} color="#fbbf24" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.85rem', color: '#fef08a' }}>
            <strong>Zero ETH Balance Detected (0.0 ETH):</strong> Transactions require a small amount of gas. If testing on Localhost, import Hardhat's pre-funded account (Account #0 or #1) into MetaMask using its private key to get 10,000 free test ETH.
          </div>
        </div>
      )}

      {/* Success Modal / Banner */}
      {submissionStatus === 'confirmed' && confirmedId && (
        <div
          className="glass-panel"
          style={{
            padding: '2rem',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(15, 23, 42, 0.95) 100%)',
            borderColor: 'rgba(16, 185, 129, 0.4)',
            marginBottom: '2rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={24} color="#34d399" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#ffffff' }}>
                Complaint Successfully Recorded on Blockchain!
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Your submission is permanently etched on the decentralized ledger.
              </p>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Your Unique Complaint Tracking ID
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#34d399', fontFamily: 'JetBrains Mono' }}>
                #{confirmedId}
              </div>
            </div>

            <button
              onClick={copyIdToClipboard}
              className="btn-secondary"
              style={{ fontSize: '0.9rem', padding: '0.65rem 1.25rem' }}
            >
              <Copy size={16} />
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Complaint ID'}</span>
            </button>
          </div>

          <div style={{ fontSize: '0.9rem', color: '#fef08a', marginBottom: '1rem', background: 'rgba(234, 179, 8, 0.1)', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
            ⚠️ <strong>Important:</strong> Please save your Complaint ID! Because this dApp does not record your email or personal wallet in storage, this ID is your only proof to track status updates and review official responses.
          </div>

          {txHash && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <span>Transaction Hash:</span>
              <span className="font-mono" style={{ color: '#818cf8' }}>
                {txHash.substring(0, 14)}...{txHash.substring(txHash.length - 8)}
              </span>
              {explorerUrl && (
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#818cf8', display: 'inline-flex', alignItems: 'center', gap: '2px', textDecoration: 'none' }}
                >
                  <ExternalLink size={14} />
                  <span>View on Etherscan</span>
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* Main Submission Form */}
      <div className="glass-panel" style={{ padding: '2.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ width: '2.75rem', height: '2.75rem', borderRadius: '0.75rem', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={22} color="#818cf8" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#ffffff' }}>
              Submit Anonymous Grievance
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Zero identity data collected · Immutable smart contract recording
            </p>
          </div>
        </div>

        {/* Anti-Identification Warning (FR-2.3) */}
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: '0.75rem',
          padding: '1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
        }}>
          <AlertTriangle size={20} color="#f87171" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.85rem', color: '#fca5a5', lineHeight: '1.5' }}>
            <strong>Mandatory Privacy Warning (FR-2.3):</strong> Do not mention names, enrollment numbers, email addresses, or specific phone numbers in your text. Blockchain storage is permanent and public. Protect your identity by keeping reports factual and objective.
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Category Selector */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: '#ffffff' }}>
              Complaint Category (FR-2.1)
            </label>
            <select
              className="select-control"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isSubmitting}
            >
              {COMPLAINT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Description Textarea */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#ffffff' }}>
                Complaint Description (FR-2.2)
              </label>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: remainingChars < 100 ? '#f87171' : 'var(--text-subtle)',
                }}
                className="font-mono"
              >
                {remainingChars} characters remaining
              </span>
            </div>

            <textarea
              className="textarea-control"
              rows={6}
              placeholder="Describe your issue objectively without mentioning personal names or student IDs..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={MAX_CHARS}
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
              fontSize: '0.85rem',
              lineHeight: '1.5',
            }}>
              <strong>Error: </strong> {errorMessage}
            </div>
          )}

          {/* In-Flight Transaction State Feedback (FR-7.1) */}
          {isSubmitting && (
            <div style={{
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: '0.75rem',
              padding: '1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}>
              <Loader2 size={20} color="#818cf8" className="pulse-dot" />
              <div style={{ fontSize: '0.85rem' }}>
                {submissionStatus === 'signing' && (
                  <span>
                    <strong>MetaMask Signature Required:</strong> Please check MetaMask and click "Confirm" to sign the transaction...
                  </span>
                )}
                {submissionStatus === 'mining' && (
                  <span>
                    <strong>Mining On-Chain:</strong> Broadcasting to blockchain network. Awaiting block confirmation...
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Submit Action */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem' }}>
            <button
              type="submit"
              disabled={isSubmitting || !description.trim() || !account || !isContractReady}
              className="btn-primary"
              style={{ width: '100%', padding: '0.9rem' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="pulse-dot" />
                  <span>Processing Blockchain Transaction...</span>
                </>
              ) : !account ? (
                <span>Connect MetaMask to Submit</span>
              ) : !isContractReady ? (
                <span>Switch to Hardhat Localhost First</span>
              ) : (
                <>
                  <Send size={18} />
                  <span>Submit to Blockchain Ledger</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
