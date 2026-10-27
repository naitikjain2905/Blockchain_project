const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("==================================================");
  console.log("Deploying ComplaintBox Smart Contract...");
  console.log(`Network: ${hre.network.name} (Chain ID: ${hre.network.config.chainId || "unknown"})`);

  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deployer Address (Admin): ${deployer.address}`);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Deployer Balance: ${hre.ethers.formatEther(balance)} ETH`);

  // Deploy ComplaintBox contract
  const ComplaintBox = await hre.ethers.getContractFactory("ComplaintBox");
  const complaintBox = await ComplaintBox.deploy();
  await complaintBox.waitForDeployment();

  const contractAddress = await complaintBox.getAddress();
  console.log(`✅ ComplaintBox deployed successfully at: ${contractAddress}`);
  console.log(`Admin configured as: ${await complaintBox.admin()}`);

  // Sync address and ABI with the frontend
  const frontendContractsDir = path.join(__dirname, "..", "frontend", "src", "contracts");
  if (!fs.existsSync(frontendContractsDir)) {
    fs.mkdirSync(frontendContractsDir, { recursive: true });
  }

  // Save Contract Address with network configuration
  const addressFilePath = path.join(frontendContractsDir, "contractAddress.json");
  let existingAddresses = {};
  if (fs.existsSync(addressFilePath)) {
    try {
      existingAddresses = JSON.parse(fs.readFileSync(addressFilePath, "utf8"));
    } catch {
      existingAddresses = {};
    }
  }

  existingAddresses[hre.network.name] = {
    address: contractAddress,
    chainId: hre.network.config.chainId,
    admin: deployer.address,
    deployedAt: new Date().toISOString(),
  };

  fs.writeFileSync(addressFilePath, JSON.stringify(existingAddresses, null, 2));
  console.log(`Updated frontend contract address: ${addressFilePath}`);

  // Save Contract ABI
  const artifactPath = path.join(__dirname, "..", "artifacts", "contracts", "ComplaintBox.sol", "ComplaintBox.json");
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const abiFilePath = path.join(frontendContractsDir, "ComplaintBoxAbi.json");
    fs.writeFileSync(abiFilePath, JSON.stringify(artifact.abi, null, 2));
    console.log(`Updated frontend ABI file: ${abiFilePath}`);
  }

  console.log("==================================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });

