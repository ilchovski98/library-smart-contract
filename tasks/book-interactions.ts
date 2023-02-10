import { task, subtask } from "hardhat/config";
import lazyImport from "../utils/lazyImport";

task("deploy-book-interactions", "Deploys library contract, adds a new book, borrows it and prints additional info")
  .addParam("bookName", "The name of the new book")
  .addParam("bookCopies", "The number of copies of the new book")
  .setAction(async (taskArgs, hre) => {
    const { main } = await lazyImport("./../scripts/deploy-library");
    const { library } = await main();

    const { runAllBookInteractions } = await lazyImport("./../scripts/book-interactions");
    await runAllBookInteractions(taskArgs.bookName, taskArgs.bookCopies, library.address);
  });

task("book-interactions", "Adds a new book, borrows it and prints additional info")
  .addParam("bookName", "The name of the new book")
  .addParam("bookCopies", "The number of copies of the new book")
  .addParam("contractAddress", "The library contract address")
  .setAction(async (taskArgs, hre) => {
    const { runAllBookInteractions } = await lazyImport("./../scripts/book-interactions");
    await runAllBookInteractions(taskArgs.bookName, taskArgs.bookCopies, taskArgs.contractAddress);
  });
