// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;
// TODO: @todo Fix node modules import statement
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";

error NotOwner();
error InvalidBookData();
error BookUnavailable();
error AlreadyBorrowedBook();
error BookAlreadyAdded();

contract Library is Ownable {
    event AddBook(string indexed bookName, uint copies);
    event BorrowBook(address indexed borrower, string indexed bookName);
    event ReturnBook(address indexed borrower, string indexed bookName);

    struct Book {
        string name;
        uint copies;
        address[] borrowers;
    }

    bytes32[] public bookKeys;

    mapping(bytes32 => bool) public insertedBookKeys;
    mapping(bytes32 => Book) public books;
    mapping(address => mapping(bytes32 => bool)) public borrowedBooks;

    modifier validBookName(string calldata _bookName) {
        if (!(bytes(_bookName).length > 0 && bytes(_bookName).length <= 32)) revert InvalidBookData();
        _;
    }

    modifier ownerOf(string calldata _bookName) {
        if (!borrowedBooks[msg.sender][bytes32(bytes(_bookName))]) revert NotOwner();
        _;
    }

    function addBook(string calldata _bookName, uint _copies) external validBookName(_bookName) onlyOwner {
        if (_copies == 0) revert InvalidBookData();
        bytes32 bookName = bytes32(bytes(_bookName));
        if (insertedBookKeys[bookName]) revert BookAlreadyAdded();

        insertedBookKeys[bookName] = true;
        bookKeys.push(bookName);
        books[bookName] = Book(_bookName, _copies, new address[](0));

        emit AddBook(_bookName, _copies);
    }

    function returnBook(string calldata _bookName) external validBookName(_bookName) ownerOf(_bookName) {
        bytes32 bookName = bytes32(bytes(_bookName));
        borrowedBooks[msg.sender][bookName] = false;
        ++books[bookName].copies;
        emit ReturnBook(msg.sender, _bookName);
    }

    function borrowBook(string calldata _bookName) external validBookName(_bookName) {
        bytes32 bookName = bytes32(bytes(_bookName));
        Book storage targetBook = books[bookName];
        if (targetBook.copies == 0) revert BookUnavailable();
        if (borrowedBooks[msg.sender][bookName]) revert AlreadyBorrowedBook();

        --targetBook.copies;
        borrowedBooks[msg.sender][bookName] = true;
        targetBook.borrowers.push(msg.sender);

        emit BorrowBook(msg.sender, _bookName);
    }

    function getNumberOfBooks() public view returns (uint) {
        return bookKeys.length;
    }

    function getBook(string calldata _bookName) external view validBookName(_bookName) returns (Book memory) {
        return books[bytes32(bytes(_bookName))];
    }

    // Helper function for easy testing
    function stringToByte32(string calldata _string) external pure returns (bytes32) {
        return bytes32(bytes(_string));
    }
}
