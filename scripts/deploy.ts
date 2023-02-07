import hre, { ethers } from "hardhat";

export async function main() {
  const Library_Factory = await ethers.getContractFactory("Library");
  const library = await Library_Factory.deploy();
  const transaction = await library.deployed();
  await transaction.deployTransaction.wait(5);

  // await hre.run("verify:verify", {
  //   address: usElection.address,
  //   constructorArguments: [
  //    // if any
  //   ],
  // });
  console.log(`The Library contract is deployed to ${library.address}`);
}
