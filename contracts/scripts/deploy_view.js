const { ethers } = require("hardhat");

async function main() {
  const DAO_ADDRESS = "0x2250713E805770c0C614DB8c7e9E3DA8fb7ADD47";

  const View = await ethers.getContractFactory("CarbonCreditsDAOView");
  const view = await View.deploy(DAO_ADDRESS);
  await view.waitForDeployment();

  console.log("CarbonCreditsDAOView deployed to:", await view.getAddress());
}

main().catch((e) => { console.error(e); process.exit(1); });