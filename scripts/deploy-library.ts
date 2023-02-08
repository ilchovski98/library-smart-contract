import hre, { ethers } from "hardhat";

export async function main() {
  const Library_Factory = await ethers.getContractFactory("Library");
  console.log('deploying contract...');
  const library = await Library_Factory.deploy();
  const transaction = await library.deployed();

  if (hre.network.name == 'goerli' || hre.network.name == 'sepolia') {
    console.log('waiting for 5 confirmation blocks...');
    await transaction.deployTransaction.wait(5);
    console.log('5 confirmation blocks passed');
    await hre.run("verify:verify", {
      address: library.address,
    });
  }

  return { library }
}
