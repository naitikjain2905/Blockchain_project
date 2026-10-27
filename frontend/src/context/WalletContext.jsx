import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import {
  hasMetaMask,
  SUPPORTED_NETWORKS,
  DEFAULT_CHAIN_ID,
  getActiveContractAddress,
  getComplaintContract,
  getFallbackProvider
} from '../utils/ethereum';

const WalletContext = createContext(null);

const STORAGE_DISCONNECT_KEY = 'anonymous_complaint_wallet_disconnected';

export function WalletProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(DEFAULT_CHAIN_ID);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [balance, setBalance] = useState('0');
  const [adminAddress, setAdminAddress] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Track active unmounted state to prevent memory leaks / fatal background setStates
  const isMountedRef = useRef(true);

  const contractAddress = getActiveContractAddress(chainId);
  const isContractReady = Boolean(contractAddress);

  // Determine if connected user is admin
  const isAdmin = Boolean(
    account && adminAddress && account.toLowerCase() === adminAddress.toLowerCase()
  );

  const isSupportedNetwork = Boolean(chainId && (Number(chainId) === 31337 || Number(chainId) === 11155111));
  const networkName = SUPPORTED_NETWORKS[chainId]?.name || (chainId ? `Network (Chain ${chainId})` : 'Unknown Network');

  /**
   * Safely reads contract admin address and account balance without crashing
   */
  const loadAccountData = useCallback(async (currentProvider, currentAccount, currentChainId) => {
    if (!currentProvider || !currentAccount || !isMountedRef.current) return;

    // 1. Fetch balance safely
    try {
      const rawBalance = await currentProvider.getBalance(currentAccount);
      if (isMountedRef.current) {
        setBalance(ethers.formatEther(rawBalance));
      }
    } catch (err) {
      // Non-fatal warning
      console.warn('Could not read wallet balance:', err.message);
    }

    // 2. Fetch contract admin if contract is deployed on this network
    const activeAddress = getActiveContractAddress(currentChainId);
    if (!activeAddress) {
      if (isMountedRef.current) setAdminAddress('');
      return;
    }

    try {
      const contract = getComplaintContract(currentProvider, currentChainId);
      const onChainAdmin = await contract.admin();
      if (isMountedRef.current) {
        setAdminAddress(onChainAdmin);
      }
    } catch (err) {
      console.warn('Could not read admin address from contract:', err.message);
      if (isMountedRef.current) {
        setAdminAddress('');
      }
    }
  }, []);

  /**
   * Connects MetaMask wallet
   */
  const connectWallet = useCallback(async () => {
    if (!hasMetaMask()) {
      setErrorMessage('MetaMask is not detected. Please install MetaMask in your browser.');
      return;
    }

    try {
      setIsConnecting(true);
      setErrorMessage('');

      // Remove manual disconnect flag
      localStorage.removeItem(STORAGE_DISCONNECT_KEY);

      const browserProvider = new ethers.BrowserProvider(window.ethereum, 'any');
      const accounts = await browserProvider.send('eth_requestAccounts', []);
      const network = await browserProvider.getNetwork();
      const currentSigner = await browserProvider.getSigner();

      const userAccount = accounts[0];
      const currentChainId = Number(network.chainId);

      if (isMountedRef.current) {
        setAccount(userAccount);
        setChainId(currentChainId);
        setProvider(browserProvider);
        setSigner(currentSigner);
      }

      await loadAccountData(browserProvider, userAccount, currentChainId);
    } catch (err) {
      console.error('Wallet connection error:', err);
      if (isMountedRef.current) {
        if (err.code === 4001 || err.code === 'ACTION_REJECTED') {
          setErrorMessage('Connection request rejected in MetaMask.');
        } else {
          setErrorMessage(err.message || 'Failed to connect wallet.');
        }
      }
    } finally {
      if (isMountedRef.current) {
        setIsConnecting(false);
      }
    }
  }, [loadAccountData]);

  /**
   * Disconnects local state and remembers user preference so it does not auto-reconnect
   */
  const disconnectWallet = useCallback(() => {
    localStorage.setItem(STORAGE_DISCONNECT_KEY, 'true');
    setAccount(null);
    setSigner(null);
    setBalance('0');
    setAdminAddress('');
    setErrorMessage('');
    // Switch to fallback read-only provider for visitor browsing (SRS 2.3)
    const fallback = getFallbackProvider(chainId);
    setProvider(fallback);
  }, [chainId]);

  /**
   * Requests network switch in MetaMask (e.g., to Hardhat Localhost 31337 or Sepolia)
   */
  const switchNetwork = useCallback(async (targetChainId) => {
    if (!hasMetaMask()) return;
    const config = SUPPORTED_NETWORKS[targetChainId];
    if (!config) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: config.chainIdHex }],
      });
    } catch (switchError) {
      if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: config.chainIdHex,
                chainName: config.name,
                rpcUrls: config.rpcUrls,
                nativeCurrency: config.nativeCurrency,
                blockExplorerUrls: config.blockExplorerUrl ? [config.blockExplorerUrl] : [],
              },
            ],
          });
        } catch (addError) {
          console.error('Failed to add network to MetaMask:', addError);
          if (isMountedRef.current) {
            setErrorMessage(`Failed to add ${config.name} to MetaMask: ${addError.message}`);
          }
        }
      } else {
        console.error('Failed to switch network:', switchError);
        if (isMountedRef.current) {
          setErrorMessage(`Could not switch network: ${switchError.message}`);
        }
      }
    }
  }, []);

  // Life-cycle listeners
  useEffect(() => {
    isMountedRef.current = true;

    // Check if user previously clicked "Disconnect"
    const wasDisconnected = localStorage.getItem(STORAGE_DISCONNECT_KEY) === 'true';

    if (hasMetaMask() && !wasDisconnected) {
      // Auto-reconnect if already approved in MetaMask
      window.ethereum.request({ method: 'eth_accounts' }).then(async (accounts) => {
        if (!isMountedRef.current) return;
        if (accounts && accounts.length > 0) {
          try {
            const browserProvider = new ethers.BrowserProvider(window.ethereum, 'any');
            const network = await browserProvider.getNetwork();
            const currentSigner = await browserProvider.getSigner();
            const currentChainId = Number(network.chainId);

            setAccount(accounts[0]);
            setChainId(currentChainId);
            setProvider(browserProvider);
            setSigner(currentSigner);

            await loadAccountData(browserProvider, accounts[0], currentChainId);
          } catch (e) {
            console.warn('Auto-session restoration:', e.message);
          }
        } else {
          // No active account, use fallback provider for visitor mode
          setProvider(getFallbackProvider(DEFAULT_CHAIN_ID));
        }
      }).catch(() => {
        if (isMountedRef.current) {
          setProvider(getFallbackProvider(DEFAULT_CHAIN_ID));
        }
      });
    } else {
      // Fallback provider for visitors (SRS 2.3)
      setProvider(getFallbackProvider(DEFAULT_CHAIN_ID));
    }

    if (!hasMetaMask()) return;

    const handleAccountsChanged = async (accounts) => {
      if (!isMountedRef.current) return;
      if (!accounts || accounts.length === 0) {
        disconnectWallet();
      } else {
        // If user actively selected an account in MetaMask, clear disconnect flag
        localStorage.removeItem(STORAGE_DISCONNECT_KEY);
        setAccount(accounts[0]);
        try {
          const freshProvider = new ethers.BrowserProvider(window.ethereum, 'any');
          const freshSigner = await freshProvider.getSigner();
          setProvider(freshProvider);
          setSigner(freshSigner);
          await loadAccountData(freshProvider, accounts[0], chainId);
        } catch (e) {
          console.warn('Account change update:', e.message);
        }
      }
    };

    const handleChainChanged = async (newChainHex) => {
      if (!isMountedRef.current) return;
      const newChain = parseInt(newChainHex, 16);
      setChainId(newChain);

      // Create a fresh provider instance to avoid cached network errors
      try {
        const freshProvider = new ethers.BrowserProvider(window.ethereum, 'any');
        setProvider(freshProvider);
        if (account) {
          const freshSigner = await freshProvider.getSigner();
          setSigner(freshSigner);
          await loadAccountData(freshProvider, account, newChain);
        }
      } catch (e) {
        console.warn('Chain change update:', e.message);
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      isMountedRef.current = false;
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [disconnectWallet, loadAccountData]);

  // Read-only query provider (uses connected provider if present, otherwise fallback)
  const queryProvider = provider || getFallbackProvider(chainId);

  return (
    <WalletContext.Provider
      value={{
        account,
        chainId,
        balance,
        provider,
        queryProvider,
        signer,
        isAdmin,
        adminAddress,
        contractAddress,
        isContractReady,
        networkName,
        isConnecting,
        isSupportedNetwork,
        errorMessage,
        connectWallet,
        disconnectWallet,
        switchNetwork,
        refreshAccount: () => loadAccountData(provider, account, chainId),
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
