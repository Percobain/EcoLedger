const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log("Starting deployment...");

  // Get the contract factory
  const CarbonCreditsDAO = await ethers.getContractFactory("CarbonCreditsDAO");
  
  console.log("Deploying CarbonCreditsDAO as UUPS proxy...");
  
  // Deploy the proxy
  const carbonCreditsDAO = await upgrades.deployProxy(
    CarbonCreditsDAO,
    [], // No constructor arguments since we use initialize()
    {
      kind: 'uups',
      initializer: 'initialize'
    }
  );

  await carbonCreditsDAO.waitForDeployment();
  
  const proxyAddress = await carbonCreditsDAO.getAddress();
  console.log("CarbonCreditsDAO proxy deployed to:", proxyAddress);
  
  // Get the implementation address
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  console.log("Implementation deployed to:", implementationAddress);
  
  // Get the admin address
  const adminAddress = await upgrades.erc1967.getAdminAddress(proxyAddress);
  console.log("Admin (ProxyAdmin) deployed to:", adminAddress);
  
  // Verify the deployment by calling a view function
  try {
    const totalProjects = await carbonCreditsDAO.totalProjectsListed();
    console.log("Initial total projects:", totalProjects.toString());
    
    const daoDepositFee = await carbonCreditsDAO.daoDepositFee();
    console.log("DAO Deposit Fee (basis points):", daoDepositFee.toString());
    
    const nccrAddress = await carbonCreditsDAO.nccr();
    console.log("NCCR Address:", nccrAddress);
    
    console.log("✅ Contract initialized successfully!");
  } catch (error) {
    console.error("❌ Error verifying deployment:", error);
  }
  
  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    proxyAddress: proxyAddress,
    implementationAddress: implementationAddress,
    adminAddress: adminAddress,
    deployedAt: new Date().toISOString(),
    deployer: (await ethers.getSigners())[0].address
  };
  
  console.log("\n�� Deployment Summary:");
  console.log("Network:", deploymentInfo.network);
  console.log("Proxy Address:", deploymentInfo.proxyAddress);
  console.log("Implementation Address:", deploymentInfo.implementationAddress);
  console.log("Admin Address:", deploymentInfo.adminAddress);
  console.log("Deployer:", deploymentInfo.deployer);
  
  // Instructions for future upgrades
  console.log("\n🔄 To upgrade this contract in the future:");
  console.log("1. Make your changes to the contract");
  console.log("2. Run: npx hardhat run scripts/upgrade.js --network sepolia");
  console.log("3. The proxy address will remain the same:", proxyAddress);
  
  return deploymentInfo;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
  