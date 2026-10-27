import React from 'react';
import { useWallet } from '../context/WalletContext';
import { formatAddress, SUPPORTED_NETWORKS } from '../utils/ethereum';
import { Shield, Wallet, AlertCircle, CheckCircle2, ChevronRight, UserCheck } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const {
    account,
    chainId,
    isAdmin,
    isConnecting,
    isSupportedNetwork,
    connectWallet,
    disconnectWallet,
    switchNetwork,
  } = useWallet();

  const navItems = [
    { id: 'overview', label: 'Dashboard & Stats' },
    { id: 'submit', label: 'Submit Complaint' },
    { id: 'track', label: 'Track Status' },
    { id: 'public', label: 'Public Feed' },
    { id: 'admin', label: 'Admin Authority', badge: isAdmin ? 'Verified' : null },
  ];

  return (
    <header style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100 }}>
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '4.5rem' }}>
        {/* Logo and Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => setActiveTab('overview')}>
          <div style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
          }}>
            <Shield size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: '800', fontSize: '1.1rem', letterSpacing: '-0.02em', color: '#ffffff' }}>
                Anonymous Complaint Box
              </span>
              <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', fontWeight: '700' }}>
                SEPOLIA dAPP
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Decentralized · Zero-Knowledge Identity · Immutable
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', gap: '0.35rem' }}>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                background: activeTab === item.id ? 'var(--primary-light)' : 'transparent',
                color: activeTab === item.id ? '#ffffff' : 'var(--text-muted)',
                border: activeTab === item.id ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                borderRadius: '0.6rem',
                padding: '0.5rem 0.85rem',
                fontWeight: activeTab === item.id ? '700' : '500',
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.15s ease',
              }}
            >
              {item.label}
              {item.badge && (
                <span style={{
                  fontSize: '0.65rem',
                  background: 'var(--success-bg)',
                  color: 'var(--success)',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '9999px',
                  fontWeight: '700',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Network & Wallet Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Network Selector / Warning */}
          {account && (
            <div>
              {isSupportedNetwork ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.8rem',
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: '#34d399',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                }}>
                  <div className="pulse-dot" style={{ backgroundColor: '#10b981' }} />
                  <span>{SUPPORTED_NETWORKS[chainId]?.name || 'Connected'}</span>
                </div>
              ) : (
                <button
                  onClick={() => switchNetwork(11155111)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.8rem',
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#f87171',
                    padding: '0.4rem 0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    cursor: 'pointer',
                    fontWeight: '600',
                  }}
                  title="Click to switch to Sepolia"
                >
                  <AlertCircle size={14} />
                  <span>Switch to Sepolia</span>
                </button>
              )}
            </div>
          )}

          {/* Connect / Wallet Info */}
          {account ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '0.6rem',
                  fontSize: '0.875rem',
                }}
              >
                {isAdmin ? (
                  <UserCheck size={16} color="#10b981" title="Contract Administrator" />
                ) : (
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1' }} />
                )}
                <span className="font-mono" style={{ fontWeight: '600' }}>
                  {formatAddress(account)}
                </span>
              </div>
              <button
                onClick={disconnectWallet}
                className="btn-secondary"
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                title="Disconnect from local interface"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="btn-primary"
              style={{ padding: '0.55rem 1.15rem' }}
            >
              <Wallet size={16} />
              <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

