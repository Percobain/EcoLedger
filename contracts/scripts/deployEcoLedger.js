const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🌱 Deploying EcoLedger Platform...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  
  const deployerBalance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(deployerBalance), "ETH");

  // Deploy EcoLedger (which will also deploy CarbonToken internally)
  console.log("\n🚀 Deploying EcoLedger contract...");
  const EcoLedger = await ethers.getContractFactory("EcoLedger");
  const ecoLedger = await EcoLedger.deploy();
  await ecoLedger.waitForDeployment();

  const ecoLedgerAddress = await ecoLedger.getAddress();
  console.log("✅ EcoLedger deployed to:", ecoLedgerAddress);

  // Get the deployment transaction
  const deploymentTx = ecoLedger.deploymentTransaction();
  
  // Get the CarbonToken address (deployed internally)
  const carbonTokenAddress = await ecoLedger.carbonToken();
  console.log("✅ CarbonToken (CC) deployed to:", carbonTokenAddress);

  // Verify deployment by testing basic functions
  console.log("\n🔍 Verifying deployment...");
  
  let verificationData = {};
  
  try {
    const nccr = await ecoLedger.nccr();
    const daoTreasury = await ecoLedger.daoTreasury();
    const jury = await ecoLedger.jury();
    const totalProjects = await ecoLedger.totalProjectsListed();
    
    console.log("NCCR Address:", nccr);
    console.log("DAO Treasury:", daoTreasury);
    console.log("Jury Address:", jury);
    console.log("Total Projects Listed:", totalProjects.toString());
    
    // Test CarbonToken
    const carbonToken = await ethers.getContractAt("CarbonToken", carbonTokenAddress);
    const tokenName = await carbonToken.name();
    const tokenSymbol = await carbonToken.symbol();
    const tokenMinter = await carbonToken.minter();
    
    console.log("Carbon Token Name:", tokenName);
    console.log("Carbon Token Symbol:", tokenSymbol);
    console.log("Carbon Token Minter:", tokenMinter);
    
    // Test NFT contract
    const nftName = await ecoLedger.name();
    const nftSymbol = await ecoLedger.symbol();
    
    console.log("NFT Collection Name:", nftName);
    console.log("NFT Collection Symbol:", nftSymbol);
    
    verificationData = {
      addresses: {
        nccr,
        daoTreasury,
        jury
      },
      carbonToken: {
        name: tokenName,
        symbol: tokenSymbol,
        minter: tokenMinter
      },
      nftCollection: {
        name: nftName,
        symbol: nftSymbol
      },
      stats: {
        totalProjectsListed: totalProjects.toString()
      }
    };
    
    console.log("\n✅ All deployments verified successfully!");
    
  } catch (error) {
    console.error("❌ Deployment verification failed:", error);
    return;
  }

  // Prepare deployment data
  const deploymentData = {
    network: "sepolia",
    timestamp: new Date().toISOString(),
    deployer: {
      address: deployer.address,
      balance: ethers.formatEther(deployerBalance) + " ETH"
    },
    contracts: {
      EcoLedger: {
        address: ecoLedgerAddress,
        name: "EcoLedger",
        type: "Main Contract (ERC721 + Platform)",
        transactionHash: deploymentTx?.hash || "N/A",
        blockNumber: deploymentTx?.blockNumber || "N/A"
      },
      CarbonToken: {
        address: carbonTokenAddress,
        name: "Carbon Credit",
        symbol: "CC",
        type: "ERC20 Token",
        deployedBy: "EcoLedger constructor"
      }
    },
    verification: verificationData,
    links: {
      ecoLedgerEtherscan: `https://sepolia.etherscan.io/address/${ecoLedgerAddress}`,
      carbonTokenEtherscan: `https://sepolia.etherscan.io/address/${carbonTokenAddress}`
    },
    integration: {
      frontendConstant: `const CONTRACT_ADDRESS = "${ecoLedgerAddress}";`,
      verifyCommand: `npx hardhat verify --network sepolia ${ecoLedgerAddress}`,
      networkConfig: {
        chainId: 11155111,
        name: "Sepolia Testnet",
        rpcUrl: "https://sepolia.infura.io/v3/",
        blockExplorer: "https://sepolia.etherscan.io"
      }
    }
  };

  // Save to deployments.json
  const deploymentsDir = path.join(__dirname, "..");
  const deploymentsFile = path.join(deploymentsDir, "deployments.json");
  
  try {
    // Create deployments directory if it doesn't exist
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    // Write deployment data to file
    fs.writeFileSync(deploymentsFile, JSON.stringify(deploymentData, null, 2));
    console.log("\n💾 Deployment data saved to:", deploymentsFile);
    
  } catch (error) {
    console.error("❌ Failed to save deployment data:", error);
  }

  console.log("\n📋 DEPLOYMENT SUMMARY");
  console.log("==========================================");
  console.log("🎯 MAIN CONTRACT ADDRESS (Use this one):", ecoLedgerAddress);
  console.log("🪙 ERC20 Carbon Token Address:", carbonTokenAddress);
  console.log("🏛️ NFT Collection Name: Carbon Project Certificate (CPC)");
  console.log("💰 ERC20 Token Name: Carbon Credit (CC)");
  console.log("🌐 Network: Sepolia Testnet");
  console.log("⛽ Deployer:", deployer.address);
  console.log("📅 Deployed at:", new Date().toLocaleString());
  console.log("==========================================");
  
  console.log("\n🔧 For frontend integration:");
  console.log(`const CONTRACT_ADDRESS = "${ecoLedgerAddress}";`);
  
  console.log("\n🌐 View on Sepolia Etherscan:");
  console.log(`EcoLedger: https://sepolia.etherscan.io/address/${ecoLedgerAddress}`);
  console.log(`CarbonToken: https://sepolia.etherscan.io/address/${carbonTokenAddress}`);
  
  console.log("\n📝 To verify on Etherscan, run:");
  console.log(`npx hardhat verify --network sepolia ${ecoLedgerAddress}`);
  
  console.log("\n💾 All deployment details saved to: deployments.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });