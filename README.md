# Anonymous Complaint Box Using Blockchain

[![Solidity](https://img.shields.io/badge/Solidity-%5E0.8.20-363636?logo=solidity)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.22-yellow?logo=ethereum)](https://hardhat.org/)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)](https://vitejs.dev/)
[![ethers.js](https://img.shields.io/badge/ethers.js-v6-2535a0)](https://docs.ethers.org/)
[![Network](https://img.shields.io/badge/Network-Ethereum_Sepolia_%2F_Localhost-627EEA)](https://sepolia.etherscan.io/)
[![Standard](https://img.shields.io/badge/Specification-IEEE_830_SRS-success)]()

A decentralized, serverless application (dApp) developed in strict compliance with the **IEEE Std 830-1998 Software Requirements Specification (SRS)**. The platform enables students to submit grievances (academic, hostel, harassment, infrastructure, etc.) without revealing their real-world identity or collecting personal identifiers. Complaints are permanently stored on the Ethereum blockchain, making them tamper-proof, non-deletable, and verifiable by the public, while providing an authorized administrative channel for investigations and official responses.

---

## Table of Contents

- [1. Motivation & Problem Statement](#1-motivation--problem-statement)
- [2. System Architecture](#2-system-architecture)
- [3. SRS Functional Requirements Traceability](#3-srs-functional-requirements-traceability)
- [4. Project Structure](#4-project-structure)
- [5. Quickstart with `run.bat` (One-Click Launch)](#5-quickstart-with-runbat-one-click-launch)
- [6. Manual Installation & Development](#6-manual-installation--development)
- [7. Deploying to Ethereum Sepolia Testnet](#7-deploying-to-ethereum-sepolia-testnet)
- [8. Smart Contract Specification](#8-smart-contract-specification)
- [9. Automated Unit Testing](#9-automated-unit-testing)
- [10. Privacy & Anonymity Model](#10-privacy--anonymity-model)
- [11. Technology Stack](#11-technology-stack)
- [12. Future Scope](#12-future-scope)

---

## 1. Motivation & Problem Statement

In colleges and organizations, traditional grievance systems rely on paper suggestion boxes or web forms with centralized databases. These systems present critical flaws:
1. **Fear of Identity Exposure:** Students hesitate to report harassment, ragging, or grading bias due to fear of retribution.
2. **Lack of Trust:** Administrators or database operators can alter, conceal, or delete records without public detection.
3. **Absence of Verifiable Progress:** Complainants cannot verify that an authority has reviewed their case or committed to an official resolution.

This dApp replaces centralized databases with an **Ethereum smart contract**. The submitter's identity is neither collected nor stored on-chain, and smart contract rules strictly prohibit modifying or deleting complaint text once mined.

---

## 2. System Architecture

```
   ┌────────────────────────────────────────────────────────┐
   │             Student / Admin Web Browser                │
   │               (React 18 + Vite + CSS)                  │
   └───────────────────────────┬────────────────────────────┘
                               │ EIP-1193 / ethers.js v6
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │                 MetaMask Wallet                        │
   │      (Signs Transactions / Holds Private Keys)         │
   └───────────────────────────┬────────────────────────────┘
                               │ JSON-RPC (HTTP / WebSocket)
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │       ComplaintBox Smart Contract (Solidity 0.8.20)     │
   │   - submitComplaint(category, description)             │
   │   - updateStatus(id, newStatus, response) [onlyAdmin]  │
   │   - getComplaint(id) / getAllComplaints() / getStats() │
   │   - Events: ComplaintSubmitted, StatusUpdated          │
   └────────────────────────────────────────────────────────┘
```

### State Machine (SRS Section 5.2)

```
        ┌─────────────┐
        │  Submitted  │ (Initial status assigned on-chain)
        └──────┬──────┘
               │
               ▼
       ┌───────────────┐
       │ Under Review  │ (Authority investigates grievance)
       └───┬───────┬───┘
           │       │
           ▼       ▼
    ┌──────────┐ ┌──────────┐
    │ Resolved │ │ Rejected │ (Finalized with official response)
    └──────────┘ └──────────┘
```

---

## 3. SRS Functional Requirements Traceability

| SRS Requirement ID | Description | Implementation Status |
|:---|:---|:---|
| **FR-1.1 - FR-1.5** | Wallet connection, address shortening, network switch detection, account listeners, MetaMask detection | `WalletContext.jsx`, `Navbar.jsx` |
| **FR-1.6** | Advisory recommending a fresh wallet for pseudonymity | `PrivacyNotice.jsx` |
| **FR-2.1 - FR-2.2** | Form with category and description; non-empty & length validation (<= 2000 chars) | `SubmitComplaint.jsx`, `ComplaintBox.sol` |
| **FR-2.3** | Anti-identification warning preventing entry of names/IDs | `SubmitComplaint.jsx` |
| **FR-2.4** | On-chain storage with unique ID, timestamp, category, status `Submitted` | `ComplaintBox.sol::submitComplaint()` |
| **FR-2.5** | Post-confirmation feedback showing assigned Complaint ID and transaction hash | `SubmitComplaint.jsx` |
| **FR-2.6** | Zero collection of names, emails, phone numbers, or passwords | Verified (no backend database) |
| **FR-3.1 - FR-3.3** | Query complaint by ID, show status, audit timeline, admin response, and handle non-existent IDs | `TrackComplaint.jsx`, `ComplaintBox.sol` |
| **FR-4.1 - FR-4.3** | Public filterable feed; strictly omits submitter's address from interface | `PublicComplaints.jsx` |
| **FR-5.1 - FR-5.6** | Admin verification, viewing all complaints, updating status with response, non-admin rejection, immutability of complaint text | `AdminPanel.jsx`, `ComplaintBox.sol` |
| **FR-6.1 - FR-6.2** | Real-time on-chain statistics (total, pending, under review, resolved, rejected) with event auto-refresh | `StatsOverview.jsx`, `ComplaintBox.sol::getStats()` |
| **FR-7.1 - FR-7.2** | Transaction state feedback (signing, mining, confirmed, failed) with Etherscan deep-links | `SubmitComplaint.jsx`, `AdminPanel.jsx` |
| **SC-1 - SC-5** | `onlyAdmin` modifier, non-deletable text, input bounds, zero fund holding, anti-spam safeguards | `ComplaintBox.sol` |

---

## 4. Project Structure

```
Blockchain_project/
├── contracts/
│   └── ComplaintBox.sol          # Solidity 0.8.20 Smart Contract
├── scripts/
│   └── deploy.js                 # Deployment script (syncs address & ABI to frontend)
├── test/
│   └── ComplaintBox.test.js      # Comprehensive unit tests (18 tests, 100% pass)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx            # Header, wallet status, network switcher
│   │   │   ├── PrivacyNotice.jsx     # Pseudonymity & fresh wallet advisory
│   │   │   ├── StatsOverview.jsx     # Aggregated on-chain metrics & pillars
│   │   │   ├── SubmitComplaint.jsx   # Submission form with character count & ID copy
│   │   │   ├── TrackComplaint.jsx    # Status lookup with lifecycle timeline
│   │   │   ├── PublicComplaints.jsx  # Public feed with category/status filters
│   │   │   └── AdminPanel.jsx        # Admin-only triage and official replies
│   │   ├── context/
│   │   │   └── WalletContext.jsx     # EIP-1193 MetaMask state & events provider
│   │   ├── contracts/
│   │   │   ├── ComplaintBoxAbi.json  # Auto-synced contract ABI
│   │   │   └── contractAddress.json  # Auto-synced deployment addresses
│   │   ├── utils/
│   │   │   ├── ethereum.js           # Ethers v6 connection & network configs
│   │   │   └── formatters.js         # Timestamp formatters & status definitions
│   │   ├── App.jsx                   # Main layout container
│   │   ├── main.jsx                  # React DOM mount point
│   │   └── index.css                 # Sleek glassmorphism theme stylesheet
│   ├── index.html                    # HTML shell
│   ├── vite.config.js                # Vite build and dev server config
│   └── package.json                  # Frontend dependencies
├── hardhat.config.js             # Hardhat network & compiler configuration
├── package.json                  # Root dependencies (Hardhat, Toolbox)
├── run.bat                       # Windows one-click automated execution script
├── .gitignore                    # Excludes node_modules, keys, and artifacts
├── .env.example                  # Template for Sepolia RPC & private keys
├── SRS.txt                       # Software Requirements Specification (Plaintext)
└── Synopsis.txt                  # Project Synopsis (Plaintext)
```

---

## 5. Quickstart with `run.bat` (One-Click Launch)

The easiest way to execute and test the entire project on Windows is using the provided `run.bat` file.

### Step 1: Double-Click or Execute `run.bat`
Open PowerShell or Command Prompt in the project folder and run:
```cmd
run.bat
```
Alternatively, simply **double-click** `run.bat` in Windows File Explorer.

### Step 2: Automated Pre-Flight Checks
`run.bat` will automatically:
1. Verify that **Node.js** and **npm** are installed.
2. Install root Hardhat dependencies if not already present.
3. Install frontend React dependencies if not already present.
4. Compile `ComplaintBox.sol` using Solidity `0.8.20`.

### Step 3: Choose an Execution Mode
When prompted in the interactive menu:
```text
===============================================================================
Select an Execution Mode:
[1] Launch Full Local Environment (Local Node + Auto-Deploy + Frontend) [DEFAULT]
[2] Run Comprehensive Hardhat Test Suite (18 tests)
[3] Deploy Smart Contract to Ethereum Sepolia Testnet
[4] Launch Frontend Only (connected to configured contract)
===============================================================================
```
- **Option 1 (Default):** Press `Enter`.
  - Spawns a local Hardhat blockchain node (`http://127.0.0.1:8545`).
  - Automatically deploys the smart contract to the local node.
  - Syncs the contract address and ABI with the frontend.
  - Launches the Vite web server and opens `http://localhost:5173` in your default browser.
- **Option 2:** Executes the full Chai/Mocha unit test suite (18 automated tests).
- **Option 3:** Prompts for your Sepolia RPC and private key, then deploys directly to Ethereum Sepolia.
- **Option 4:** Starts the frontend development server without re-deploying.

### Step 4: Testing with MetaMask (Localhost)
If using Option 1, connect your MetaMask extension to the local network:
1. **Network Name:** Hardhat Localhost
2. **RPC URL:** `http://127.0.0.1:8545`
3. **Chain ID:** `31337`
4. **Currency Symbol:** `ETH`

Import the pre-funded test accounts provided by the Hardhat local node:
- **Admin / Deployer Account:**
  - Address: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
  - Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
- **Student / Complainant Account:**
  - Address: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
  - Private Key: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`

---

## 6. Manual Installation & Development

If you prefer to run individual commands manually:

### 1. Install Root Dependencies
```bash
npm install
```

### 2. Install Frontend Dependencies
```bash
npm --prefix frontend install
```

### 3. Compile Contracts
```bash
npx hardhat compile
```

### 4. Run Unit Tests
```bash
npx hardhat test
```

### 5. Spin Up Local Node & Deploy
In Terminal 1:
```bash
npx hardhat node
```
In Terminal 2:
```bash
npx hardhat run scripts/deploy.js --network localhost
```

### 6. Start Frontend Development Server
```bash
npm --prefix frontend run dev
```
Navigate to `http://localhost:5173`.

---

## 7. Deploying to Ethereum Sepolia Testnet

To deploy the application to the live Ethereum Sepolia test network (SRS Section 8.2):

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Populate `.env` with your Sepolia RPC endpoint (Alchemy / Infura / Public) and your testnet wallet private key:
   ```env
   SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
   PRIVATE_KEY=your_private_key_without_0x_or_with_0x
   ```
   > **Note:** Obtain free Sepolia test ETH from public faucets (e.g., [sepoliafaucet.com](https://sepoliafaucet.com)).
3. Run the deployment script targeting Sepolia:
   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```
4. The deployment script will log the verified contract address and automatically update `frontend/src/contracts/contractAddress.json`.
5. Run the frontend or build it for static hosting (AWS Amplify / S3 / Vercel):
   ```bash
   npm --prefix frontend run build
   ```

---

## 8. Smart Contract Specification

The smart contract `ComplaintBox.sol` is designed following best security and gas optimization practices:

### Data Model
```solidity
enum Status {
    Submitted,   // 0: Initial state upon submission
    UnderReview, // 1: Authority actively investigating
    Resolved,    // 2: Remedial action completed
    Rejected     // 3: Invalid or dismissed
}

struct Complaint {
    uint256 id;
    string category;
    string description;
    uint256 timestamp;
    Status status;
    string adminResponse;
}
```

### Key Functions
- `submitComplaint(string category, string description) external returns (uint256)`:
  - Validates category (1 to 100 bytes) and description (1 to 2000 bytes).
  - Increments `complaintCount` and stores the grievance.
  - Emits `ComplaintSubmitted(newComplaintId, category, block.timestamp)`.
  - **Does NOT store `msg.sender` in contract state**, ensuring that on-chain storage preserves pseudonymity.
- `updateStatus(uint256 id, Status newStatus, string response) external onlyAdmin`:
  - Enforces access control via `onlyAdmin` modifier.
  - Rejects attempts to revert status to `Submitted`.
  - Updates status and appends admin response without modifying the original complaint text (Rule SC-2).
  - Emits `StatusUpdated(id, newStatus, response, block.timestamp)`.
- `getComplaint(uint256 id) external view returns (Complaint memory)`:
  - Returns complete complaint details for status tracking.
- `getAllComplaints() external view returns (Complaint[] memory)`:
  - Returns all registered complaints for public feed and administrative dashboards.
- `getStats() external view returns (uint256 total, uint256 pending, uint256 underReview, uint256 resolved, uint256 rejected)`:
  - Aggregates real-time statistics in a single call.

---

## 9. Automated Unit Testing

The test suite in [`test/ComplaintBox.test.js`](file:///C:/ANOTHER_DRIVE/Blockchain_project/test/ComplaintBox.test.js) comprehensively validates all functional and non-functional requirements:

```
  ComplaintBox Smart Contract
    1. Deployment & Access Control Initialization
      ✓ Should correctly initialize the deployer as the admin
      ✓ Should initialize total complaint count to zero
    2. Complaint Submission (FR-2.1 to FR-2.6, SC-2, SC-3)
      ✓ Should successfully submit a complaint and emit ComplaintSubmitted event
      ✓ Should increment IDs monotonically for sequential submissions
      ✓ Should reject submissions with empty category
      ✓ Should reject submissions with empty description
      ✓ Should reject submissions exceeding maximum category length
      ✓ Should reject submissions exceeding maximum description length
    3. Status Updates & Admin Authority (FR-5.1 to FR-5.6, SC-1)
      ✓ Should allow the admin to move status to UnderReview with response
      ✓ Should allow the admin to move status to Resolved
      ✓ Should allow the admin to move status to Rejected
      ✓ Should revert if a non-admin attempts to update status (SC-1)
      ✓ Should revert if updating a non-existent complaint ID
      ✓ Should revert if attempting to set status back to Submitted
      ✓ Should verify original complaint description remains immutable after status updates (SC-2)
    4. Queries and Aggregated Statistics (FR-3.1, FR-4.1, FR-6.1)
      ✓ Should retrieve all complaints correctly with getAllComplaints()
      ✓ Should calculate accurate stats via getStats()
      ✓ Should revert when querying getComplaint() with out-of-range ID

  18 passing (1s)
```

---

## 10. Privacy & Anonymity Model

To safeguard complainants in compliance with SRS Section 6.3 and Section 8.3:

1. **Zero Database Storage:** No traditional database is used. No names, passwords, cookies, or IP addresses are collected.
2. **On-Chain Pseudonymity:** While Ethereum transactions originate from a wallet address, the contract state explicitly omits storing submitter addresses.
3. **Fresh Wallet Guidance:** The UI prominently guides users to generate a fresh, unlinked MetaMask address before submitting grievances.
4. **Anti-Identification Safeguards:** Form controls provide prominent warnings advising users not to mention names, enrollment numbers, or phone numbers in complaint descriptions.

---

## 11. Technology Stack

| Layer | Component | Description |
|:---|:---|:---|
| **Smart Contract** | Solidity `^0.8.20` | Core logic, state machine, access control, event emission |
| **Development Framework** | Hardhat `v2.22` | Local blockchain node, test runner, deployment orchestrator |
| **Testing** | Mocha & Chai | 18 unit tests validating full specification coverage |
| **Frontend Framework** | React `18.3` + Vite `5.4` | Responsive single-page application |
| **Web3 Interface** | ethers.js `v6.13` | Contract interaction, event listening, transaction signing |
| **Wallet Provider** | MetaMask (EIP-1193) | Decentralized identity and transaction authorization |
| **Styling & Icons** | Custom Glassmorphism CSS + Lucide Icons | Responsive modern design system |
| **Target Network** | Ethereum Sepolia / Hardhat Localhost | Public testnet and local sandbox environments |

---

## 12. Future Scope (SRS Section 8.4)

- **Zero-Knowledge Proofs (ZK-SNARKs):** Prove the submitter is an active student without revealing student ID or wallet linkage.
- **Asymmetric Encryption:** Encrypt complaint text with the administration's public key so only authorized committee members can decipher details.
- **Multi-Signature Governance:** Replace the single admin wallet with a multi-signature committee (e.g., Gnosis Safe) for complaint resolutions.
- **Gasless Meta-Transactions (ERC-2771 / EIP-4337):** Enable students to submit grievances without needing testnet ETH via account abstraction relayers.
- **Decentralized Storage (IPFS / Filecoin):** Support encrypted evidence attachments (photos, PDFs).

---

## License

This project is licensed under the [MIT License](LICENSE).
Developed in accordance with IEEE Std 830-1998 guidelines for academic and organizational decentralized grievance management.

