/**
 * Book API Routes
 * Handles all book-related operations
 */

import { Hono } from 'hono';
import {
  getBooks,
  getBookById,
  saveBook,
  deleteBook,
  getGenres,
  generateId
} from '../data/kvProvider.js';

const app = new Hono();

// GET /api/books - List all books
app.get('/', async (c) => {
  try {
    const { sortBy, sortOrder } = c.req.query();
    let books = await getBooks(c.env.READING_ASSISTANT_KV);
    
    // Apply server-side sorting if requested
    if (sortBy && sortOrder) {
      books = sortBooks(books, sortBy, sortOrder);
    }
    
    return c.json({ data: books });
  } catch (error) {
    console.error('Error fetching books:', error);
    return c.json({
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch books'
      }
    }, 500);
  }
});

// POST /api/books - Create new book
app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { title, author, genreIds, readingLevel, ageRange } = body;

    // Validation
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return c.json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Book title is required'
        }
      }, 400);
    }

    // Validate author if provided
    if (author !== undefined && author !== null) {
      if (typeof author !== 'string' || author.trim().length === 0) {
        return c.json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Book author must be a non-empty string'
          }
        }, 400);
      }
    }

    // Check if book with this title and author already exists
    const existingBooks = await getBooks(c.env.READING_ASSISTANT_KV);
    const normalizedTitle = title.toLowerCase().trim();
    const normalizedAuthor = author ? author.toLowerCase().trim() : null;

    const duplicate = existingBooks.find(b => {
      const bookTitle = b.title.toLowerCase();
      const bookAuthor = b.author ? b.author.toLowerCase() : null;

      // If both books have authors, check title + author
      if (normalizedAuthor && bookAuthor) {
        return bookTitle === normalizedTitle && bookAuthor === normalizedAuthor;
      }
      // If neither has author, just check title
      if (!normalizedAuthor && !bookAuthor) {
        return bookTitle === normalizedTitle;
      }
      // If one has author and other doesn't, they're different
      return false;
    });

    if (duplicate) {
      const duplicateMessage = author
        ? 'A book with this title and author already exists'
        : 'A book with this title already exists';
      return c.json({
        error: {
          code: 'DUPLICATE_ERROR',
          message: duplicateMessage
        }
      }, 409);
    }

    // Validate genre IDs if provided
    if (genreIds && Array.isArray(genreIds)) {
      const genres = await getGenres(c.env.READING_ASSISTANT_KV);
      const validGenreIds = genres.map(g => g.id);
      const invalidGenres = genreIds.filter(id => !validGenreIds.includes(id));

      if (invalidGenres.length > 0) {
        return c.json({
          error: {
            code: 'VALIDATION_ERROR',
            message: `Invalid genre IDs: ${invalidGenres.join(', ')}`
          }
        }, 400);
      }
    }

    const book = {
      id: generateId(),
      title: title.trim(),
      author: author ? author.trim() : null,
      genreIds: genreIds || [],
      readingLevel: readingLevel || null,
      ageRange: ageRange || null
    };

    const savedBook = await saveBook(c.env.READING_ASSISTANT_KV, book);
    return c.json({
      data: savedBook,
      message: 'Book created successfully'
    }, 201);
  } catch (error) {
    console.error('Error creating book:', error);
    return c.json({
      error: {
        code: 'CREATE_ERROR',
        message: 'Failed to create book'
      }
    }, 500);
  }
});

// GET /api/books/export - Export all books
app.get('/export', async (c) => {
  try {
    const books = await getBooks(c.env.READING_ASSISTANT_KV);

    // Transform to export format matching the user's example
    const exportData = books.map(book => ({
      id: book.id,
      title: book.title,
      author: book.author,
      genreIds: book.genreIds || [],
      readingLevel: book.readingLevel || null,
      ageRange: book.ageRange || null,
      description: book.description || null
    }));

    return c.json(exportData);
  } catch (error) {
    console.error('Error exporting books:', error);
    return c.json({
      error: {
        code: 'EXPORT_ERROR',
        message: 'Failed to export books'
      }
    }, 500);
  }
});

// GET /api/books/:id - Get book by ID
app.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const book = await getBookById(c.env.READING_ASSISTANT_KV, id);

    if (!book) {
      return c.json({
        error: {
          code: 'NOT_FOUND',
          message: 'Book not found'
        }
      }, 404);
    }

    return c.json({ data: book });
  } catch (error) {
    console.error('Error fetching book:', error);
    return c.json({
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch book'
      }
    }, 500);
  }
});

// PUT /api/books/:id - Update book
app.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const updates = await c.req.json();

    const existingBook = await getBookById(c.env.READING_ASSISTANT_KV, id);
    if (!existingBook) {
      return c.json({
        error: {
          code: 'NOT_FOUND',
          message: 'Book not found'
        }
      }, 404);
    }

    // Validate title if provided
    if (updates.title !== undefined) {
      if (typeof updates.title !== 'string' || updates.title.trim().length === 0) {
        return c.json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Book title must be a non-empty string'
          }
        }, 400);
      }
      updates.title = updates.title.trim();
    }

    // Validate author if provided
    if (updates.author !== undefined) {
      if (typeof updates.author !== 'string' || updates.author.trim().length === 0) {
        return c.json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Book author must be a non-empty string'
          }
        }, 400);
      }
      updates.author = updates.author.trim();
    }

    // Validate title/author combination if both are provided
    if (updates.title !== undefined && updates.author !== undefined) {
      const allBooks = await getBooks(c.env.READING_ASSISTANT_KV);
      const duplicate = allBooks.find(b =>
        b.id !== id &&
        b.title.toLowerCase() === updates.title.toLowerCase() &&
        b.author.toLowerCase() === updates.author.toLowerCase()
      );
      if (duplicate) {
        return c.json({
          error: {
            code: 'DUPLICATE_ERROR',
            message: 'Another book with this title and author already exists'
          }
        }, 409);
      }
    }

    // Validate genre IDs if provided
    if (updates.genreIds !== undefined) {
      if (!Array.isArray(updates.genreIds)) {
        return c.json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Genre IDs must be an array'
          }
        }, 400);
      }

      const genres = await getGenres(c.env.READING_ASSISTANT_KV);
      const validGenreIds = genres.map(g => g.id);
      const invalidGenres = updates.genreIds.filter(id => !validGenreIds.includes(id));

      if (invalidGenres.length > 0) {
        return c.json({
          error: {
            code: 'VALIDATION_ERROR',
            message: `Invalid genre IDs: ${invalidGenres.join(', ')}`
          }
        }, 400);
      }
    }

    const updatedBook = {
      ...existingBook,
      ...updates
    };

    const savedBook = await saveBook(c.env.READING_ASSISTANT_KV, updatedBook);
    return c.json({
      data: savedBook,
      message: 'Book updated successfully'
    });
  } catch (error) {
    console.error('Error updating book:', error);
    return c.json({
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to update book'
      }
    }, 500);
  }
});

// DELETE /api/books/:id - Delete book
app.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();

    const existingBook = await getBookById(c.env.READING_ASSISTANT_KV, id);
    if (!existingBook) {
      return c.json({
        error: {
          code: 'NOT_FOUND',
          message: 'Book not found'
        }
      }, 404);
    }

    await deleteBook(c.env.READING_ASSISTANT_KV, id);
    return c.json({
      message: 'Book deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting book:', error);
    return c.json({
      error: {
        code: 'DELETE_ERROR',
        message: 'Failed to delete book'
      }
    }, 500);
  }
});

// GET /api/books/search - Search OpenLibrary for books
app.get('/search/external', async (c) => {
  try {
    const { q: query, limit = 10 } = c.req.query();

    if (!query || query.trim().length === 0) {
      return c.json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Search query is required'
        }
      }, 400);
    }

    // Search OpenLibrary API
    const searchUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(query.trim())}&limit=${limit}&fields=key,title,author_name,first_publish_year,editions,cover_i,subject`;
    const response = await fetch(searchUrl);

    if (!response.ok) {
      return c.json({
        error: {
          code: 'EXTERNAL_API_ERROR',
          message: 'Failed to search OpenLibrary'
        }
      }, 500);
    }

    const data = await response.json();

    // Transform the data to match our book format
    const books = data.docs.map(doc => ({
      id: null, // External books don't have our internal ID yet
      title: doc.title,
      author: doc.author_name ? doc.author_name.join(', ') : 'Unknown Author',
      externalId: doc.key,
      firstPublishYear: doc.first_publish_year,
      coverImage: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
      subjects: doc.subject ? doc.subject.slice(0, 5) : [], // Limit to first 5 subjects
      editionCount: doc.editions ? doc.editions.count || 0 : 0
    }));

    return c.json({
      data: books,
      total: data.num_found,
      message: `Found ${books.length} books matching "${query}"`
    });
  } catch (error) {
    console.error('Error searching OpenLibrary:', error);
    return c.json({
      error: {
        code: 'SEARCH_ERROR',
        message: 'Failed to search external library'
      }
    }, 500);
  }
});

// GET /api/books/external/:workId - Get detailed book info from OpenLibrary
app.get('/external/:workId', async (c) => {
  try {
    const { workId } = c.req.param();

    // Remove any prefix like "/works/" if present
    const cleanWorkId = workId.replace('/works/', '');

    // Fetch work data from OpenLibrary
    const workUrl = `https://openlibrary.org/works/${cleanWorkId}.json`;
    const workResponse = await fetch(workUrl);

    if (!workResponse.ok) {
      return c.json({
        error: {
          code: 'EXTERNAL_API_ERROR',
          message: 'Book not found in OpenLibrary'
        }
      }, 404);
    }

    const workData = await workResponse.json();

    // Fetch author data if available
    let authorData = null;
    if (workData.authors && workData.authors.length > 0) {
      const authorKey = workData.authors[0].author?.key || workData.authors[0].key;
      if (authorKey) {
        const cleanAuthorKey = authorKey.replace('/authors/', '');
        const authorUrl = `https://openlibrary.org/authors/${cleanAuthorKey}.json`;
        const authorResponse = await fetch(authorUrl);
        if (authorResponse.ok) {
          authorData = await authorResponse.json();
        }
      }
    }

    // Transform to our format
    const bookData = {
      title: workData.title,
      author: authorData?.name || 'Unknown Author',
      description: workData.description?.value || workData.description || null,
      subjects: workData.subjects ? workData.subjects.slice(0, 10) : [],
      firstPublishYear: workData.first_publish_date ? new Date(workData.first_publish_date).getFullYear() : null,
      coverImage: workData.covers && workData.covers.length > 0 ? `https://covers.openlibrary.org/b/id/${workData.covers[0]}-L.jpg` : null,
      externalId: workData.key,
      authorBio: authorData?.bio?.value || authorData?.bio || null,
      authorBirthDate: authorData?.birth_date || null,
      authorDeathDate: authorData?.death_date || null,
      pageCount: workData.number_of_pages_median || null
    };

    return c.json({ data: bookData });
  } catch (error) {
    console.error('Error fetching book from OpenLibrary:', error);
    return c.json({
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch book details'
      }
    }, 500);
  }
});

// POST /api/books/import - Import book from OpenLibrary to local library
app.post('/import', async (c) => {
  try {
    const body = await c.req.json();
    const { externalId, genreIds, readingLevel, ageRange } = body;

    if (!externalId) {
      return c.json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'External ID is required'
        }
      }, 400);
    }

    // Get detailed book data from OpenLibrary
    const cleanWorkId = externalId.replace('/works/', '');
    const workUrl = `https://openlibrary.org/works/${cleanWorkId}.json`;
    const workResponse = await fetch(workUrl);

    if (!workResponse.ok) {
      return c.json({
        error: {
          code: 'EXTERNAL_API_ERROR',
          message: 'Book not found in OpenLibrary'
        }
      }, 404);
    }

    const workData = await workResponse.json();

    // Get author data
    let authorData = null;
    if (workData.authors && workData.authors.length > 0) {
      const authorKey = workData.authors[0].author?.key || workData.authors[0].key;
      if (authorKey) {
        const cleanAuthorKey = authorKey.replace('/authors/', '');
        const authorUrl = `https://openlibrary.org/authors/${cleanAuthorKey}.json`;
        const authorResponse = await fetch(authorUrl);
        if (authorResponse.ok) {
          authorData = await authorResponse.json();
        }
      }
    }

    // Check if book already exists in our library
    const existingBooks = await getBooks(c.env.READING_ASSISTANT_KV);
    const duplicate = existingBooks.find(b =>
      b.title.toLowerCase() === workData.title.toLowerCase() &&
      (authorData?.name || 'Unknown Author').toLowerCase() === b.author.toLowerCase()
    );

    if (duplicate) {
      return c.json({
        error: {
          code: 'DUPLICATE_ERROR',
          message: 'This book already exists in your library'
        }
      }, 409);
    }

    // Validate genre IDs if provided
    if (genreIds && Array.isArray(genreIds)) {
      const genres = await getGenres(c.env.READING_ASSISTANT_KV);
      const validGenreIds = genres.map(g => g.id);
      const invalidGenres = genreIds.filter(id => !validGenreIds.includes(id));

      if (invalidGenres.length > 0) {
        return c.json({
          error: {
            code: 'VALIDATION_ERROR',
            message: `Invalid genre IDs: ${invalidGenres.join(', ')}`
          }
        }, 400);
      }
    }

    // Create book object
    const book = {
      id: generateId(),
      title: workData.title,
      author: authorData?.name || 'Unknown Author',
      genreIds: genreIds || [],
      readingLevel: readingLevel || null,
      ageRange: ageRange || null,
      description: workData.description?.value || workData.description || null,
      coverImage: workData.covers && workData.covers.length > 0 ? `https://covers.openlibrary.org/b/id/${workData.covers[0]}-L.jpg` : null,
      firstPublishYear: workData.first_publish_date ? new Date(workData.first_publish_date).getFullYear() : null,
      externalId: workData.key,
      importedFrom: 'openlibrary',
      importedAt: new Date().toISOString()
    };

    const savedBook = await saveBook(c.env.READING_ASSISTANT_KV, book);
    return c.json({
      data: savedBook,
      message: 'Book imported successfully from OpenLibrary'
    }, 201);
  } catch (error) {
    console.error('Error importing book from OpenLibrary:', error);
    return c.json({
      error: {
        code: 'IMPORT_ERROR',
        message: 'Failed to import book'
      }
    }, 500);
  }
});

// POST /api/books/bulk - Bulk import books
app.post('/bulk', async (c) => {
  try {
    const body = await c.req.json();
    const { books } = body;

    if (!Array.isArray(books)) {
      return c.json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Books must be an array'
        }
      }, 400);
    }

    const createdBooks = [];
    const errors = [];

    // Get valid genres for validation
    const genres = await getGenres(c.env.READING_ASSISTANT_KV);
    const validGenreIds = genres.map(g => g.id);

    for (const bookData of books) {
      try {
        // Validate genre IDs
        let genreIds = bookData.genreIds || [];
        if (genreIds.length > 0) {
          const invalidGenres = genreIds.filter(id => !validGenreIds.includes(id));
          if (invalidGenres.length > 0) {
            errors.push(`Book "${bookData.title}" has invalid genre IDs: ${invalidGenres.join(', ')}`);
            continue;
          }
        }

        const book = {
          id: generateId(),
          title: bookData.title?.trim(),
          author: bookData.author?.trim(),
          genreIds: genreIds,
          readingLevel: bookData.readingLevel || null,
          ageRange: bookData.ageRange || null
        };

        // Validation
        if (!book.title || book.title.length === 0) {
          errors.push(`Book missing title: ${JSON.stringify(bookData)}`);
          continue;
        }

        if (!book.author || book.author.length === 0) {
          errors.push(`Book "${book.title}" missing author`);
          continue;
        }

        const savedBook = await saveBook(c.env.READING_ASSISTANT_KV, book);
        createdBooks.push(savedBook);
      } catch (error) {
        errors.push(`Error creating book "${bookData.title}": ${error.message}`);
      }
    }

    return c.json({
      data: {
        created: createdBooks,
        errors
      },
      message: `Created ${createdBooks.length} books${errors.length > 0 ? `, ${errors.length} errors` : ''}`
    }, createdBooks.length > 0 ? 201 : 400);
  } catch (error) {
    console.error('Error bulk importing books:', error);
    return c.json({
      error: {
        code: 'BULK_IMPORT_ERROR',
        message: 'Failed to import books'
      }
    }, 500);
  }
});

// POST /api/books/batch-import - Import books from external JSON format
app.post('/batch-import', async (c) => {
  try {
    const importBooks = await c.req.json();

    if (!Array.isArray(importBooks)) {
      return c.json({
        error: {
          code: 'INVALID_INPUT',
          message: 'Import data must be an array of books'
        }
      }, 400);
    }

    const createdBooks = [];
    const errors = [];

    for (const bookData of importBooks) {
      try {
        // Validate required fields
        if (!bookData.title || !bookData.author) {
          errors.push(`Book missing title or author: ${JSON.stringify(bookData)}`);
          continue;
        }

        // Generate new ID for the imported book (preserve original if provided)
        const newId = bookData.id || crypto.randomUUID();
        const book = {
          id: newId,
          title: bookData.title,
          author: bookData.author,
          genreIds: bookData.genreIds || [],
          readingLevel: bookData.readingLevel || null,
          ageRange: bookData.ageRange || null,
          description: bookData.description || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Check for duplicates
        const normalizedTitle = book.title.toLowerCase().trim();
        const normalizedAuthor = book.author.toLowerCase().trim();
        const existingBooks = await getBooks(c.env.READING_ASSISTANT_KV);
        const existingBook = existingBooks.find(b => {
          const existingTitle = b.title.toLowerCase().trim();
          const existingAuthor = b.author.toLowerCase().trim();
          return existingTitle === normalizedTitle && existingAuthor === normalizedAuthor;
        });

        if (existingBook) {
          errors.push(`Book "${bookData.title}" by ${bookData.author} already exists`);
          continue;
        }

        await saveBook(c.env.READING_ASSISTANT_KV, book);
        createdBooks.push(book);
      } catch (error) {
        errors.push(`Error importing book "${bookData.title}": ${error.message}`);
      }
    }

    return c.json({
      data: {
        imported: createdBooks.length,
        errors: errors
      },
      message: `Imported ${createdBooks.length} books${errors.length > 0 ? `, ${errors.length} errors` : ''}`
    }, createdBooks.length > 0 ? 201 : 400);
  } catch (error) {
    console.error('Error importing books:', error);
    return c.json({
      error: {
        code: 'IMPORT_ERROR',
        message: 'Failed to import books'
      }
    }, 500);
  }
});

// Helper function to sort books
function sortBooks(books, sortBy, sortOrder) {
  const sorted = [...books];
  
  sorted.sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case 'author':
        aValue = (a.author || '').toLowerCase();
        bValue = (b.author || '').toLowerCase();
        break;
      case 'readingLevel':
        aValue = a.readingLevel || '';
        bValue = b.readingLevel || '';
        break;
      case 'ageRange':
        aValue = a.ageRange || '';
        bValue = b.ageRange || '';
        break;
      default:
        return 0;
    }
    
    if (aValue < bValue) {
      return sortOrder === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortOrder === 'asc' ? 1 : -1;
    }
    return 0;
  });
  
  return sorted;
}

export default app;