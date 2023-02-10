import { expect, assert } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Library, Library__factory } from "./../typechain-types";

describe("Library", function() {
  let libraryFactory: Library__factory;
  let library: Library;
  let otherAccount: SignerWithAddress;

  before(async function() {
    const accounts = await ethers.getSigners();
    otherAccount = accounts[1];
    libraryFactory = await ethers.getContractFactory("Library");
    library = await libraryFactory.deploy();
    const transaction = await library.deployed();
    transaction.deployTransaction.wait(5);
  });

  describe("addBook", function() {
    it("Reverts when trying to add a book with an empty name", async function() {
      await expect(library.addBook("", 2))
        .to.be.revertedWithCustomError(library, "InvalidBookName");
    });

    it("Reverts when trying to add a book with more than 32 characters", async function() {
      await expect(library.addBook("Our Last Invention Our Last Invention", 2))
        .to.be.revertedWithCustomError(library, "InvalidBookName");
    });

    it("Reverts when trying to add a book with 0 copies", async function() {
      await expect(library.addBook("Mastering Ethereum", 0))
        .to.be.revertedWithCustomError(library, "InvalidBookCopies");
    });

    it("Reverts when trying to add a book while not being the owner", async function() {
      await expect(library.connect(otherAccount).addBook("Mastering Ethereum", 0))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Add a book", async function() {
      const numberOfBooksBefore = await library.getNumberOfBooks();
      await library.addBook("Mastering Ethereum", 2);
      const numberOfBooksAfter = await library.getNumberOfBooks();

      assert.equal(
        numberOfBooksBefore.add(1).toString(),
        numberOfBooksAfter.toString(),
        "Book keys array is not updated"
      );
      assert.equal(
        (await library.getBook("Mastering Ethereum")).name,
        "Mastering Ethereum",
        "Name is not updated correctly"
      );
      assert.equal(
        (await library.getBook("Mastering Ethereum")).copies.toString(),
        "2",
        "Copies are not updated correctly"
      );
    });

    it("Reverts when trying to add a book with already existing name", async function() {
      await expect(library.addBook("Mastering Ethereum", 1))
        .to.be.revertedWithCustomError(library, "BookAlreadyAdded");
    });

    it("Emits event after adding a book", async function() {
      await expect(library.addBook("Art of War", 5))
        .to.emit(library, "AddBook")
        .withArgs("Art of War", 5);
    });
  });

  describe("borrowBook", function() {
    it("borrow book", async function() {
      const signerAddress = await library.signer.getAddress();
      const bookNameBytes32 = ethers.utils.formatBytes32String("Mastering Ethereum");

      const bookBefore = await library.getBook("Mastering Ethereum");
      const bookBorrowedStatusBefore = await library.borrowedBooks(signerAddress, bookNameBytes32);

      await library.borrowBook("Mastering Ethereum");

      const bookAfter = await library.getBook("Mastering Ethereum");
      const bookBorrowedStatusAfter = await library.borrowedBooks(signerAddress, bookNameBytes32);

      assert.equal(
        bookBefore.copies.sub(1).toString(),
        bookAfter.copies.toString(),
        "Book copies is not updating correctly after a borrow"
      );
      assert.notEqual(
        bookBorrowedStatusBefore,
        bookBorrowedStatusAfter,
        "Borrowed book status is not updating after a borrow"
      );
      assert.equal(
        bookBefore.borrowers.length,
        bookAfter.borrowers.length - 1,
        "Book borrowers array is not updating correctly after a borrow"
      );
    });

    it("Revert when trying to borrow the same book", async function() {
      await expect(library.borrowBook("Mastering Ethereum"))
        .to.be.revertedWithCustomError(library, "AlreadyBorrowedBook");
    });

    it("Revert when trying to borrow a book that has 0 copies", async function() {
      await library.addBook("Think and Grow Rich", 1);
      await library.borrowBook("Think and Grow Rich");

      await expect(library.connect(otherAccount).borrowBook("Think and Grow Rich"))
        .to.be.revertedWithCustomError(library, "BookUnavailable");
    });

    it("Emits event after a borrow", async function() {
      await library.addBook("The lean startup", 1);
      await expect(library.borrowBook("The lean startup"))
        .to.emit(library, "BorrowBook")
        .withArgs(await library.signer.getAddress(), "The lean startup");
    });

    it("Reverts when trying to borrow a book with an empty name", async function() {
      await expect(library.borrowBook(""))
        .to.be.revertedWithCustomError(library, "InvalidBookName");
    });

    it("Reverts when trying to add a book with more than 32 characters", async function() {
      await expect(library.borrowBook("Our Last Invention Our Last Invention"))
        .to.be.revertedWithCustomError(library, "InvalidBookName");
    });
  });

  describe("returnBook", function() {
    it("Reverts when trying to return a book you don't own", async function() {
      await expect(library.connect(otherAccount).returnBook("Mastering Ethereum"))
        .to.be.revertedWithCustomError(library, "NotOwner");
    });

    it("Update copies after return and borrowedBooks value", async function() {
      const signerAddress = await library.signer.getAddress();
      const bookNameBytes32 = ethers.utils.formatBytes32String("Mastering Ethereum");

      const copiesBeforeReturn = (await library.getBook("Mastering Ethereum")).copies;
      const bookBorrowedStatusBefore = await library.borrowedBooks(signerAddress, bookNameBytes32);

      await library.returnBook("Mastering Ethereum");

      const copiesAfterReturn = (await library.getBook("Mastering Ethereum")).copies;
      const bookBorrowedStatusAfter = await library.borrowedBooks(signerAddress, bookNameBytes32);

      assert.equal(
        copiesBeforeReturn.add(1).toString(),
        copiesAfterReturn.toString(),
        "Copies of returned book are not updated correctly"
      );

      assert.notEqual(
        bookBorrowedStatusBefore,
        bookBorrowedStatusAfter,
        "Borrowed book status is not updating after return"
      );
    });

    it("Reverts when trying to return a book with an empty name", async function() {
      await expect(library.returnBook(""))
        .to.be.revertedWithCustomError(library, "InvalidBookName");
    });

    it("Reverts when trying to return a book with more than 32 characters", async function() {
      await expect(library.returnBook("Our Last Invention Our Last Invention"))
        .to.be.revertedWithCustomError(library, "InvalidBookName");
    });

    it("Emits event after return", async function() {
      await expect(library.returnBook("The lean startup"))
        .to.emit(library, "ReturnBook")
        .withArgs(await library.signer.getAddress(), "The lean startup");
    });
  });

  describe("getBook", function() {
    it("Reverts when trying to borrow a book with an empty name", async function() {
      await expect(library.getBook(""))
        .to.be.revertedWithCustomError(library, "InvalidBookName");
    });

    it("Reverts when trying to add a book with more than 32 characters", async function() {
      await expect(library.getBook("Our Last Invention Our Last Invention"))
        .to.be.revertedWithCustomError(library, "InvalidBookName");
    });
  });

  describe("stringToByte32", function() {
    it("Returns the correct string to bytes32 conversion", async function() {
      const stringToBytes32 = await library.stringToByte32("Harry Potter");

      assert.equal(
        stringToBytes32,
        ethers.utils.formatBytes32String("Harry Potter"),
        "string to bytes32 is not accurate"
      );
    });
  });
});
