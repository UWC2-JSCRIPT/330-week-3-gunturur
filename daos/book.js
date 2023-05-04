const mongoose = require('mongoose');

const Book = require('../models/book');

module.exports = {};

module.exports.getAll = (page, perPage) => {
  return Book.find().limit(perPage).skip(perPage*page).lean();
}

module.exports.getById = (bookId) => {
  if (!mongoose.Types.ObjectId.isValid(bookId)) {
    return null;
  }
  return Book.findOne({ _id: bookId }).lean();
}

module.exports.getByAuthorId = (authorId) => {
  if (!mongoose.Types.ObjectId.isValid(authorId)) {
    return null;
  }
  return Book.find({ authorId }).lean();
}

module.exports.getBookByISBN = async (ISBN) => {
  try {
    const book = await Book.findOne({ ISBN: ISBN }).lean();
    return book;
  } catch (e) {
    throw e;
  }
};


// module.exports.getAuthorStats = async (authorInfo) => {
//   let pipeline = [
//     {
//       $group: {
//         _id: "$authorId",
//         numBooks: { $sum: 1 },
//         averagePageCount: { $avg: "$pageCount" },
//         titles: { $push: "$title" },
//       },
//     },
//   ];

//   if (authorInfo) {
//     pipeline.unshift({
//       $lookup: {
//         from: "authors",
//         localField: "_id",
//         foreignField: "_id",
//         as: "author",
//       },
//     });
//     pipeline.push({
//       $unwind: {
//         path: "$author",
//         preserveNullAndEmptyArrays: true,
//       },
//     });
//   }

//   let stats = await Book.aggregate(pipeline).exec();

//   if (authorInfo) {
//     stats = stats.map((s) => ({
//       authorId: s._id,
//       numBooks: s.numBooks,
//       averagePageCount: s.averagePageCount,
//       titles: s.titles,
//       author: s.author,
//     }));
//   } else {
//     stats = stats.map((s) => ({
//       authorId: s._id,
//       numBooks: s.numBooks,
//       averagePageCount: s.averagePageCount,
//       titles: s.titles,
//     }));
//   }

//   return stats;
// };

module.exports.getAuthorStats = async function (includeAuthorInfo) {
  const bookGrouping = [
    {
      $group: {
        _id: "$authorId",
        numBooks: { $sum: 1 },
        averagePageCount: { $avg: "$pageCount" },
        titles: { $push: "$title" },
      },
    },
  ];
  console.log(bookGrouping);
  if (includeAuthorInfo) {
    bookGrouping.push({
      $lookup: {
        from: "authors",
        localField: "_id",
        foreignField: "_id",
        as: "author",
      },
    });
    bookGrouping.push({
      $unwind: "$author",
    });
    console.log(bookGrouping);
    bookGrouping.push({
      $project: {
        _id: 0,
        authorId: "$author._id",
        numBooks: 1,
        averagePageCount: 1,
        titles: 1,
        author: {
          _id: "$author._id",
          __v: "$author.__v",
          name: "$author.name",
          gender: "$author.gender",
          yearBorn: "$author.yearBorn",
        },
      },
    });
  } else {
    bookGrouping.push({
      $project: {
        _id: 0,
        authorId: "$_id",
        numBooks: 1,
        averagePageCount: 1,
        titles: 1,
      },
    });
  }

  const groupedBooks = await Book.aggregate(bookGrouping).exec();

  return groupedBooks;
};




module.exports.deleteById = async (bookId) => {
  if (!mongoose.Types.ObjectId.isValid(bookId)) {
    return false;
  }
  await Book.deleteOne({ _id: bookId });
  return true;
}

module.exports.updateById = async (bookId, newObj) => {
  if (!mongoose.Types.ObjectId.isValid(bookId)) {
    return false;
  }
  await Book.updateOne({ _id: bookId }, newObj);
  return true;
}

module.exports.create = async (bookData) => {
  try {
    const created = await Book.create(bookData);
    return created;
  } catch (e) {
    if (e.message.includes('validation failed')) {
      throw new BadDataError(e.message);
    }
    throw e;
  }
}

// module.exports.searchBooks = async (searchTerm) => {
//   const regex = new RegExp(searchTerm, 'i');
//   return Book.find({
//     $or: [
//       { title: regex },
//       { genre: regex },
//       { blurb: regex },
//     ],
//   }).lean();
// };

// module.exports.searchBooks = async (query) => {
//   const searchTerms = query.split(/\s+/).join(' ');
//   console.log(searchTerms);
//   const searchCondition = {
//     $text: {
//       $search: searchTerms,
//       $caseSensitive: false,
//       $diacriticSensitive: false,
//     },
//   };
//   console.log(searchCondition);
//   try {
//     const matchingBooks = await Book.find(searchCondition, { score: { $meta: 'textScore' } })
//       .sort({ score: { $meta: 'textScore' } })
//       .lean();
//     console.log(matchingBooks);

//     return matchingBooks;
//   } catch (e) {
//     throw e;
//   }
// };

// module.exports.searchBooks = async (query) => {
//   const stopWords = ['and', 'or', 'the', 'in', 'is', 'at', 'on', 'a', 'an'];

//   const searchTerms = query
//     .split(/\s+/)
//     .filter((word) => !stopWords.includes(word.toLowerCase()))
//     .join('|'); // join the words with a pipe (|) as a regex OR operator

//   console.log(searchTerms);
//   const searchCondition = {
//     $or: [
//       { title: { $regex: searchTerms, $options: 'i' } },
//       { genre: { $regex: searchTerms, $options: 'i' } },
//     ],
//   };
//   console.log(searchCondition);
//   try {
//     const matchingBooks = await Book.find(searchCondition).lean();
//     console.log(matchingBooks);

//     return matchingBooks;
//   } catch (e) {
//     throw e;
//   }
// };

module.exports.searchBooks = async (query) => {
  const stopWords = ['and', 'or', 'the', 'in', 'is', 'at', 'on', 'a', 'an'];

  const searchTerms = query
    .split(/\s+/)
    .filter((word) => !stopWords.includes(word.toLowerCase()))
    .join('|'); // join the words with a pipe (|) as a regex OR operator

  console.log(searchTerms);
  const searchCondition = {
    $or: [
      { title: { $regex: searchTerms, $options: 'i' } },
      { genre: { $regex: searchTerms, $options: 'i' } },
      { blurb: { $regex: searchTerms, $options: 'i' } },
    ],
  };
  console.log(searchCondition);

  try {
    const matchingBooks = await Book.aggregate([
      {
        $match: searchCondition,
      },
      {
        $addFields: {
          titleMatches: {
            $size: {
              $filter: {
                input: { $split: ['$title', ' '] },
                as: 'word',
                cond: { $regexMatch: { input: '$$word', regex: new RegExp(searchTerms, 'i') } },
              },
            },
          },
          genreMatches: {
            $size: {
              $filter: {
                input: { $split: ['$genre', ' '] },
                as: 'word',
                cond: { $regexMatch: { input: '$$word', regex: new RegExp(searchTerms, 'i') } },
              },
            },
          },
        },
      },
      {
        $addFields: {
          totalMatches: { $add: ['$titleMatches', '$genreMatches'] },
        },
      },
      {
        $sort: {
          totalMatches: -1,
        },
      },
    ]).exec();

    console.log(matchingBooks);
    return matchingBooks;
  } catch (e) {
    throw e;
  }
};





// module.exports.searchBooks = async (query) => {
//   const searchTerms = query.split(/\s+/).map(term => `"${term}"`).join(' ');
//   const searchCondition = {
//     $text: {
//       $search: searchTerms,
//       $caseSensitive: false,
//       $diacriticSensitive: false,
//     },
//   };

//   try {
//     const matchingBooks = await Book.find(searchCondition).lean();
//     return matchingBooks;
//   } catch (e) {
//     throw e;
//   }
// };




class BadDataError extends Error {};
module.exports.BadDataError = BadDataError;