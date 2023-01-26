// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./Ownable.sol";

contract Library is Ownable {
    event AddBook(string bookName, uint stock);
    event BorrowBook(address indexed borrower, uint indexed bookId);
    event ReturnBook(address indexed borrower, uint indexed bookId);

    struct Book {
        uint id;
        string name;
        uint stock;
    }

    Book[] public books;

    mapping(address => mapping(uint => bool)) ownerBookPossession;
    mapping(address => mapping(uint => bool)) ownerBookPossessionEver;
    mapping(uint => address[]) bookBorrowers;

    modifier ownerOf(uint _bookId) {
        require(ownerBookPossession[msg.sender][_bookId], "you must be the owner");
        _;
    }

    function addBook(string memory _bookName, uint _stock) external onlyOwner {
        books.push(Book(books.length, _bookName, _stock));
        emit AddBook(_bookName, _stock);
    }

    function returnBook(uint _bookId) external ownerOf(_bookId) {
        ownerBookPossession[msg.sender][_bookId] = false;
        books[_bookId].stock++;
        emit ReturnBook(msg.sender, _bookId);
    }

    function borrowBook(uint _bookId) external {
        Book storage targetBook = books[_bookId];
        require(targetBook.stock > 0, "not in stock");
        require(!ownerBookPossession[msg.sender][_bookId], "you already have this book");
        targetBook.stock--;
        ownerBookPossession[msg.sender][_bookId] = true;
        if (!ownerBookPossessionEver[msg.sender][_bookId]) {
            ownerBookPossessionEver[msg.sender][_bookId] = true;
            bookBorrowers[_bookId].push(msg.sender);
        }
        emit BorrowBook(msg.sender, _bookId);
    }

    function getAllBorrowersOfBook(uint _bookId) external view returns (address[] memory) {
        return bookBorrowers[_bookId];
    }

    function getAllAvailableBooks() external view returns (Book[] memory) {
        uint availableBooksCount = 0;
        
        for (uint i = 0; i < books.length; i++) {
            if (books[i].stock > 0) {
                availableBooksCount++;
            }
        }

        Book[] memory availableBooks = new Book[](availableBooksCount);
        uint availableBooksIndex = 0;

        for (uint i = 0; i < books.length; i++) {
            if (books[i].stock > 0) {
                availableBooks[availableBooksIndex] = books[i];
                availableBooksIndex++;
            }
        }

        return availableBooks;
    }
}
