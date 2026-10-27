import React, { useState } from 'react';
import { WalletProvider } from './context/WalletContext';
import Navbar from './components/Navbar';
import PrivacyNotice from './components/PrivacyNotice';
import StatsOverview from './components/StatsOverview';
import SubmitComplaint from './components/SubmitComplaint';
import TrackComplaint from './components/TrackComplaint';
import PublicComplaints from './components/PublicComplaints';
import AdminPanel from './components/AdminPanel';
import { Shield, ExternalLink, Heart } from 'lucide-react';

function MainContent() {
  const [activeTab, setActiveTab] = useState('overview');
  const [trackedId, setTrackedId] = useState('');

  const handleSubmissionSuccess = (newId) => {
    // When a complaint is submitted, keep on submit tab to view ID, or offer direct jump to track
    if (newId) {
      setTrackedId(newId);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="app-container" style={{ flex: 1, padding: '2rem 1.5rem' }}>
        {/* Privacy Notice Banner */}
        <PrivacyNotice />

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <StatsOverview setActiveTab={setActiveTab} />
        )}

        {activeTab === 'submit' && (
          <SubmitComplaint onSubmissionSuccess={handleSubmissionSuccess} />
        )}

        {activeTab === 'track' && (
          <TrackComplaint initialId={trackedId} />
        )}

        {activeTab === 'public' && (
          <PublicComplaints
            onSelectComplaint={(id) => {
              setTrackedId(id);
              setActiveTab('track');
            }}
          />
        )}

        {activeTab === 'admin' && (
          <AdminPanel />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-color)',
        padding: '2rem 1.5rem',
        background: 'rgba(15, 23, 42, 0.95)',
        marginTop: '3rem',
      }}>
        <div className="app-container" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.85rem',
          color: 'var(--text-subtle)',
        }}>
          <div>
            <div style={{ fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              Anonymous Complaint Box Using Blockchain
            </div>
            <div>
              Built strictly per IEEE 830 SRS · Solidity ^0.8.20 · React + Vite · Sepolia Testnet
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Shield size={14} color="#818cf8" />
              Immutable Smart Contract
            </span>
            <a
              href="https://sepolia.etherscan.io"
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <span>Sepolia Etherscan</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <MainContent />
    </WalletProvider>
  );
}

