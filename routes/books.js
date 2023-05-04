const { Router } = require("express");
const router = Router();

const bookDAO = require('../daos/book');
const { getAuthorStats } = require("../daos/book");
const { searchBooks } = require("../daos/book");
const { searchBooksMulti } = require("../daos/book");
const { getBookStats } = require("../daos/book");

// Create
router.post("/", async (req, res, next) => {
  const book = req.body;
  if (!book || JSON.stringify(book) === '{}') {
    res.status(400).send('book is required');
  } else {
    try {
      // Check if a book with the same ISBN already exists
      const existingBook = await bookDAO.getBookByISBN(book.ISBN);
      if (existingBook) {
        res.status(400).send("A book with this ISBN already exists");
        return;
      }

      const savedBook = await bookDAO.create(book);
      res.status(200).json(savedBook);
    } catch (e) {
      if (e instanceof bookDAO.BadDataError) {
        res.status(400).send(e.message);
      } else {
        res.status(500).send(e.message);
      }
    }
  }
});

// Search books
router.get("/search", async (req, res, next) => {
  try {
    const query = req.query.query;
    if (!query) {
      return res.status(400).send("query parameter is required");
    }
    const matchingBooks = await bookDAO.searchBooks(query);
    if (!matchingBooks) {
      return res.status(404).send("No matching books found");
    }
    return res.status(200).json(matchingBooks);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal server error");
  }
});


// Search books
router.get("/searchMulti", async (req, res, next) => {
  const query = req.query.query;
  if (!query) {
    res.status(400).send("query parameter is required");
  } else {
    try {
      const matchingBooks = await bookDAO.searchBooksMulti(query);
      res.status(200).json(matchingBooks);
    } catch (e) {
      console.error(e);
      res.status(500).send(e.message);
    }
  }
});

// Read - single book
router.get("/:id", async (req, res, next) => {
  const book = await bookDAO.getById(req.params.id);
  if (book) {
    res.json(book);
  } else {
    res.sendStatus(404);
  }
});

// Read - all books
// Read - all books or books by authorId
router.get("/", async (req, res, next) => {
  let { page, perPage, authorId } = req.query;
  page = page ? Number(page) : 0;
  perPage = perPage ? Number(perPage) : 10;

  let books;
  if (authorId) {
    books = await bookDAO.getByAuthorId(authorId);
  } else {
    books = await bookDAO.getAll(page, perPage);
  }
  res.json(books);
});


// Get authors stats
router.get("/authors/stats", async (req, res) => {
  try {
    const authorInfo = req.query.authorInfo === "true";
    const stats = await bookDAO.getAuthorStats(authorInfo);
    console.log('Stats:', stats); // Add this line to log the stats
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error:', error); // Add this line to log the error
    res.status(500).send({ error: "An error occurred while getting author stats" });
  }
});




// Update
router.put("/:id", async (req, res, next) => {
  const bookId = req.params.id;
  const book = req.body;
  if (!book || JSON.stringify(book) === '{}' ) {
    res.status(400).send('book is required"');
  } else {
    try {
      const success = await bookDAO.updateById(bookId, book);
      res.sendStatus(success ? 200 : 400); 
    } catch(e) {
      if (e instanceof bookDAO.BadDataError) {
        res.status(400).send(e.message);
      } else {
        res.status(500).send(e.message);
      }
    }
  }
});

// Delete
router.delete("/:id", async (req, res, next) => {
  const bookId = req.params.id;
  try {
    const success = await bookDAO.deleteById(bookId);
    res.sendStatus(success ? 200 : 400);
  } catch(e) {
    res.status(500).send(e.message);
  }
});

module.exports = router;