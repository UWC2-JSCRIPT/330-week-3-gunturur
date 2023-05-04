const mongoose = require('mongoose');

const Author = require('./author');

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  genre: { type: String },
  ISBN: { type: String, required: true, unique: true  },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: Author, required: true },
  blurb: { type: String },
  publicationYear: { type: Number, required: true },
  pageCount: { type: Number, required: true }
});

bookSchema.index({ authorId: 1 });
//search by title, genre, or blurb
bookSchema.index({ blurb: "text" });
// bookSchema.index({ title: "text" }, { name: "title_text", weights: { title: 1 }, default_language: "english" });
// bookSchema.index({ genre: "text" });
module.exports = mongoose.model("books", bookSchema);