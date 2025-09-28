/**
 * Data Management API Routes
 * Handles data import/export operations
 */

import { Hono } from 'hono';
import {
  getStudents,
  getClasses,
  getBooks,
  getGenres,
  getSessions,
  getSettings,
  saveStudent,
  saveClass,
  saveBook,
  saveGenre,
  saveSession,
  generateId
} from '../data/kvProvider.js';

const app = new Hono();

// GET /api/data/export - Export all data as JSON
app.get('/export', async (c) => {
  try {
    const [students, classes, books, genres, sessions, settings] = await Promise.all([
      getStudents(c.env.READING_ASSISTANT_KV),
      getClasses(c.env.READING_ASSISTANT_KV),
      getBooks(c.env.READING_ASSISTANT_KV),
      getGenres(c.env.READING_ASSISTANT_KV),
      getSessions(c.env.READING_ASSISTANT_KV),
      getSettings(c.env.READING_ASSISTANT_KV)
    ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      data: {
        students,
        classes,
        books,
        genres,
        sessions,
        settings: settings || {
          readingStatusSettings: {
            recentlyReadDays: 7,
            needsAttentionDays: 14
          }
        }
      }
    };

    return c.json({
      data: exportData,
      message: 'Data exported successfully'
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return c.json({
      error: {
        code: 'EXPORT_ERROR',
        message: 'Failed to export data'
      }
    }, 500);
  }
});

// POST /api/data/import - Import data from JSON
app.post('/import', async (c) => {
  try {
    const body = await c.req.json();
    const { data, options = {} } = body;

    if (!data) {
      return c.json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Import data is required'
        }
      }, 400);
    }

    const { overwrite = false } = options;
    const results = {
      students: { imported: 0, errors: [] },
      classes: { imported: 0, errors: [] },
      books: { imported: 0, errors: [] },
      genres: { imported: 0, errors: [] },
      sessions: { imported: 0, errors: [] }
    };

    // Get existing data to check for conflicts
    const [existingStudents, existingClasses, existingBooks, existingGenres] = await Promise.all([
      getStudents(c.env.READING_ASSISTANT_KV),
      getClasses(c.env.READING_ASSISTANT_KV),
      getBooks(c.env.READING_ASSISTANT_KV),
      getGenres(c.env.READING_ASSISTANT_KV)
    ]);

    const existingStudentNames = new Set(existingStudents.map(s => s.name.toLowerCase()));
    const existingClassNames = new Set(existingClasses.map(c => c.name.toLowerCase()));
    const existingBookTitles = new Set(existingBooks.map(b => `${b.title.toLowerCase()}|${b.author.toLowerCase()}`));
    const existingGenreNames = new Set(existingGenres.map(g => g.name.toLowerCase()));

    // Import genres first (other entities may depend on them)
    if (data.genres) {
      for (const genreData of data.genres) {
        try {
          if (!genreData.name) {
            results.genres.errors.push('Genre missing name');
            continue;
          }

          const genreName = genreData.name.toLowerCase();

          // Skip if genre already exists and not overwriting
          if (!overwrite && existingGenreNames.has(genreName)) {
            results.genres.errors.push(`Genre "${genreData.name}" already exists`);
            continue;
          }

          const genre = {
            id: overwrite ? (genreData.id || generateId()) : generateId(),
            name: genreData.name,
            description: genreData.description || null,
            isPredefined: genreData.isPredefined || false
          };

          await saveGenre(c.env.READING_ASSISTANT_KV, genre);
          results.genres.imported++;
        } catch (error) {
          results.genres.errors.push(`Error importing genre "${genreData.name}": ${error.message}`);
        }
      }
    }

    // Import classes
    if (data.classes) {
      for (const classData of data.classes) {
        try {
          if (!classData.name) {
            results.classes.errors.push('Class missing name');
            continue;
          }

          const className = classData.name.toLowerCase();

          // Skip if class already exists and not overwriting
          if (!overwrite && existingClassNames.has(className)) {
            results.classes.errors.push(`Class "${classData.name}" already exists`);
            continue;
          }

          const classEntity = {
            id: overwrite ? (classData.id || generateId()) : generateId(),
            name: classData.name,
            teacherName: classData.teacherName || null,
            schoolYear: classData.schoolYear || null,
            disabled: classData.disabled || false,
            createdAt: classData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          await saveClass(c.env.READING_ASSISTANT_KV, classEntity);
          results.classes.imported++;
        } catch (error) {
          results.classes.errors.push(`Error importing class "${classData.name}": ${error.message}`);
        }
      }
    }

    // Import books
    if (data.books) {
      for (const bookData of data.books) {
        try {
          if (!bookData.title || !bookData.author) {
            results.books.errors.push('Book missing title or author');
            continue;
          }

          const bookKey = `${bookData.title.toLowerCase()}|${bookData.author.toLowerCase()}`;

          // Skip if book already exists and not overwriting
          if (!overwrite && existingBookTitles.has(bookKey)) {
            results.books.errors.push(`Book "${bookData.title}" by ${bookData.author} already exists`);
            continue;
          }

          const book = {
            id: overwrite ? (bookData.id || generateId()) : generateId(),
            title: bookData.title,
            author: bookData.author,
            genreIds: bookData.genreIds || [],
            readingLevel: bookData.readingLevel || null,
            ageRange: bookData.ageRange || null
          };

          await saveBook(c.env.READING_ASSISTANT_KV, book);
          results.books.imported++;
        } catch (error) {
          results.books.errors.push(`Error importing book "${bookData.title}": ${error.message}`);
        }
      }
    }

    // Import students
    if (data.students) {
      for (const studentData of data.students) {
        try {
          if (!studentData.name) {
            results.students.errors.push('Student missing name');
            continue;
          }

          const studentName = studentData.name.toLowerCase();

          // Skip if student already exists and not overwriting
          if (!overwrite && existingStudentNames.has(studentName)) {
            results.students.errors.push(`Student "${studentData.name}" already exists`);
            continue;
          }

          const student = {
            id: overwrite ? (studentData.id || generateId()) : generateId(),
            name: studentData.name,
            classId: studentData.classId || null,
            readingLevel: studentData.readingLevel || null,
            lastReadDate: studentData.lastReadDate || null,
            preferences: {
              favoriteGenreIds: [],
              likes: [],
              dislikes: [],
              readingFormats: [],
              ...studentData.preferences
            },
            readingSessions: [],
            createdAt: studentData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          await saveStudent(c.env.READING_ASSISTANT_KV, student);
          results.students.imported++;
        } catch (error) {
          results.students.errors.push(`Error importing student "${studentData.name}": ${error.message}`);
        }
      }
    }

    // Import sessions
    if (data.sessions) {
      for (const sessionData of data.sessions) {
        try {
          if (!sessionData.studentId || !sessionData.date || !sessionData.assessment) {
            results.sessions.errors.push('Session missing required fields');
            continue;
          }

          const session = {
            id: overwrite ? (sessionData.id || generateId()) : generateId(),
            date: sessionData.date,
            bookId: sessionData.bookId || null,
            bookTitle: sessionData.bookTitle,
            author: sessionData.author,
            assessment: sessionData.assessment,
            notes: sessionData.notes || null,
            environment: sessionData.environment || 'school',
            studentId: sessionData.studentId
          };

          await saveSession(c.env.READING_ASSISTANT_KV, session);
          results.sessions.imported++;
        } catch (error) {
          results.sessions.errors.push(`Error importing session: ${error.message}`);
        }
      }
    }

    // Update settings if provided
    if (data.settings) {
      try {
        await saveSettings(c.env.READING_ASSISTANT_KV, data.settings);
      } catch (error) {
        console.error('Error importing settings:', error);
      }
    }

    const hasErrors = Object.values(results).some(result => result.errors.length > 0);
    const totalImported = Object.values(results).reduce((sum, result) => sum + result.imported, 0);

    return c.json({
      data: results,
      message: `Import completed. Imported ${totalImported} records${hasErrors ? ` with ${Object.values(results).reduce((sum, result) => sum + result.errors.length, 0)} errors` : ''}`
    }, hasErrors ? 207 : 201);
  } catch (error) {
    console.error('Error importing data:', error);
    return c.json({
      error: {
        code: 'IMPORT_ERROR',
        message: 'Failed to import data'
      }
    }, 500);
  }
});

export default app;