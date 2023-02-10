import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Library } from "./../typechain-types";
import LibraryData from "./../artifacts/contracts/Library.sol/Library.json";

let deployer: SignerWithAddress, libraryContract: Library;

async function addBook(bookName, bookCopies) {
  const addBookTransaction = await libraryContract.addBook(bookName, bookCopies);
  await addBookTransaction.wait();
  console.log(`1. Added ${bookCopies} unit${bookCopies > 1 ? "s" : ""} of the ${bookName} book to the library.`);
}

async function getAllAvailableBooks() {
  const numberOfBooks = (await libraryContract.getNumberOfBooks()).toNumber();
  let books: Library.BookStructOutput[] = [];

  for (let index = 0; index <= numberOfBooks - 1; index++) {
    const currentBookKey = await libraryContract.bookKeys(index);
    // using getBook instead of mapping in order to get the borrowers array inside the book struct
    const currentBook: Library.BookStructOutput = await libraryContract.getBook(ethers.utils.parseBytes32String(currentBookKey));
    books.push(currentBook);
  }

  const availableBooks = books.filter(book => book.copies.toNumber() > 0);
  console.log('2. List of the available books in the library: ', availableBooks);
}

async function borrowBook(bookName) {
  const borrowTransaction = await libraryContract.borrowBook(bookName);
  await borrowTransaction.wait();
  console.log(`3. Borrowed the ${bookName} book.`);
}

async function isBookBorrowedByAddress(bookName) {
  const isBookBorrowed = await libraryContract.borrowedBooks(deployer.address, ethers.utils.formatBytes32String(bookName));
  console.log(`4. Is the ${bookName} borrowed: `, isBookBorrowed);
}

async function returnBook(bookName) {
  const returnBookTransaction = await libraryContract.returnBook(bookName);
  await returnBookTransaction.wait();
  console.log(`5. The borrowed ${bookName} book is now returned.`);
}

async function isBookAvailable(bookName) {
  const availableCopies = (await libraryContract.getBook(bookName)).copies.toNumber();
  const isBookAvailable = availableCopies > 0;
  console.log(`6. The ${bookName} book is ${isBookAvailable ? "" : "not "}available.${isBookAvailable ? ` The library has ${availableCopies} unit${availableCopies > 1 ? "s" : ""} in stock.` : "" }`);
}

export async function runAllBookInteractions(bookName: string, bookCopies: number, deployedContractAddress: string) {
  try {
    deployer = (await ethers.getSigners())[0];
    libraryContract = new ethers.Contract(deployedContractAddress, LibraryData.abi, deployer);

    // 1. Creates a book
    await addBook(bookName, bookCopies);

    // 2. Checks all available books
    await getAllAvailableBooks();

    // 3. Rents a book
    await borrowBook(bookName);

    // 4. Checks that it is rented
    await isBookBorrowedByAddress(bookName);

    // 5. Returns the book
    await returnBook(bookName);

    // 6. Checks the availability of the book
    await isBookAvailable(bookName);
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
