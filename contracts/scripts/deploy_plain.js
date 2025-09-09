const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying CarbonCreditsDAO (no proxy)...");

  const DAOFactory = await ethers.getContractFactory("CarbonCreditsDAO");
  const dao = await DAOFactory.deploy();
  await dao.waitForDeployment();
  const daoAddress = await dao.getAddress();
  console.log("CarbonCreditsDAO deployed at:", daoAddress);

  console.log("Initializing CarbonCreditsDAO...");
  const tx = await dao.initialize();
  await tx.wait();
  console.log("Initialized.");

  console.log("Deploying CarbonCreditsDAOView...");
  const ViewFactory = await ethers.getContractFactory("CarbonCreditsDAOView");
  const view = await ViewFactory.deploy(daoAddress);
  await view.waitForDeployment();
  const viewAddress = await view.getAddress();
  console.log("CarbonCreditsDAOView deployed at:", viewAddress);

  console.log("\nAddresses:");
  console.log("DAO:", daoAddress);
  console.log("View:", viewAddress);
}

main().catch((e) => { console.error(e); process.exit(1); });