const { ethers, upgrades } = require("hardhat");

// Replace this with your deployed proxy address
const PROXY_ADDRESS = "0x2250713E805770c0C614DB8c7e9E3DA8fb7ADD47";

async function main() {
  console.log("Starting contract upgrade...");
  
  // Get the contract factory for the new implementation
  const CarbonCreditsDAO = await ethers.getContractFactory("CarbonCreditsDAO");
  
  console.log("Upgrading CarbonCreditsDAO...");
  
  // Upgrade the proxy to the new implementation
  const upgraded = await upgrades.upgradeProxy(PROXY_ADDRESS, CarbonCreditsDAO);
  
  console.log("Contract upgraded successfully!");
  console.log("Proxy address (unchanged):", PROXY_ADDRESS);
  
  // Get the new implementation address
  const newImplementationAddress = await upgrades.erc1967.getImplementationAddress(PROXY_ADDRESS);
  console.log("New implementation address:", newImplementationAddress);
  
  // Verify the upgrade by calling a view function
  try {
    const totalProjects = await upgraded.totalProjectsListed();
    console.log("Total projects after upgrade:", totalProjects.toString());
    console.log("✅ Upgrade verified successfully!");
  } catch (error) {
    console.error("❌ Error verifying upgrade:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
