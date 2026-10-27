import { ethers } from 'ethers';
import contractAddresses from '../contracts/contractAddress.json';
import ComplaintBoxAbi from '../contracts/ComplaintBoxAbi.json';

export const SUPPORTED_NETWORKS = {
  31337: {
    chainIdHex: '0x7a69',
    name: 'Hardhat Localhost',
    rpcUrls: ['http://127.0.0.1:8545'],
    blockExplorerUrl: '',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
  11155111: {
    chainIdHex: '0xaa36a7',
    name: 'Ethereum Sepolia Testnet',
    rpcUrls: ['https://rpc.sepolia.org'],
    blockExplorerUrl: 'https://sepolia.etherscan.io',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'SEP', decimals: 18 },
  },
};

export const DEFAULT_CHAIN_ID = 31337;

/**
 * Checks if MetaMask / an EIP-1193 provider is available.
 */
export function hasMetaMask() {
  return typeof window !== 'undefined' && Boolean(window.ethereum);
}

/**
 * Formats a 0x address into shortened form (e.g., 0x1234...5678).
 */
export function formatAddress(address) {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

/**
 * Resolves the deployed contract address strictly matching the active chain ID.
 * Returns empty string if not deployed on the requested network.
 */
export function getActiveContractAddress(chainId) {
  const numericChainId = Number(chainId);
  if (numericChainId === 31337) {
    return contractAddresses?.localhost?.address || contractAddresses?.hardhat?.address || '';
  }
  if (numericChainId === 11155111) {
    return contractAddresses?.sepolia?.address || '';
  }
  return '';
}

/**
 * Checks if the contract is deployed on the current chain.
 */
export function isContractDeployed(chainId) {
  const addr = getActiveContractAddress(chainId);
  return Boolean(addr && addr.length === 42 && addr.startsWith('0x'));
}

/**
 * Creates a lightweight read-only fallback provider when wallet is not connected
 * (SRS Section 2.3 Visitor Class Support)
 */
export function getFallbackProvider(chainId = DEFAULT_CHAIN_ID) {
  const config = SUPPORTED_NETWORKS[chainId] || SUPPORTED_NETWORKS[DEFAULT_CHAIN_ID];
  try {
    return new ethers.JsonRpcProvider(config.rpcUrls[0], {
      chainId: Number(chainId),
      name: config.name,
    });
  } catch (err) {
    console.warn('Fallback provider initialization:', err.message);
    return null;
  }
}

/**
 * Returns an instance of the ComplaintBox contract with ethers.js v6.
 */
export function getComplaintContract(signerOrProvider, chainId) {
  const address = getActiveContractAddress(chainId);
  if (!address) {
    const networkName = SUPPORTED_NETWORKS[chainId]?.name || `Chain ID ${chainId}`;
    throw new Error(
      `ComplaintBox smart contract is not deployed on ${networkName}. Please switch your wallet to Hardhat Localhost (Chain ID 31337).`
    );
  }
  return new ethers.Contract(address, ComplaintBoxAbi, signerOrProvider);
}

/**
 * Generates an Etherscan link for a transaction hash.
 */
export function getTransactionExplorerUrl(txHash, chainId = 11155111) {
  if (!txHash) return '';
  if (Number(chainId) === 11155111) {
    return `https://sepolia.etherscan.io/tx/${txHash}`;
  }
  return '';
}
