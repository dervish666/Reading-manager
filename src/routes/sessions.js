/**
 * Reading Session API Routes
 * Handles all reading session operations
 */

import { Hono } from 'hono';
import {
  getSessions,
  getSessionsByStudent,
  saveSession,
  deleteSession,
  getBookById,
  getStudentById,
  generateId
} from '../data/kvProvider.js';

const app = new Hono();

// GET /api/sessions - List all sessions
app.get('/', async (c) => {
  try {
    const sessions = await getSessions(c.env.READING_ASSISTANT_KV);
    return c.json({ data: sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return c.json({
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch sessions'
      }
    }, 500);
  }
});

// POST /api/sessions - Create new session
app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const {
      date,
      bookId,
      bookTitle,
      author,
      assessment,
      notes,
      environment,
      studentId,
      bookPreference
    } = body;

    // Validation
    if (!date || typeof date !== 'string') {
      return c.json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Session date is required'
        }
      }, 400);
    }

    if (!assessment || typeof assessment !== 'string' || assessment.trim().length === 0) {
      return c.json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Session assessment is required'
        }
      }, 400);
    }

    if (!environment || !['school', 'home'].includes(environment)) {
      return c.json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Environment must be either "school" or "home"'
        }
      }, 400);
    }

    // Validate book preference if provided
    if (bookPreference && !['liked', 'meh', 'disliked'].includes(bookPreference)) {
      return c.json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Book preference must be "liked", "meh", or "disliked"'
        }
      }, 400);
    }

    if (!studentId || typeof studentId !== 'string') {
      return c.json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Student ID is required'
        }
      }, 400);
    }

    // Validate student exists
    const student = await getStudentById(c.env.READING_ASSISTANT_KV, studentId);
    if (!student) {
      return c.json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Student not found'
        }
      }, 400);
    }

    // Validate book if bookId is provided
    if (bookId) {
      const book = await getBookById(c.env.READING_ASSISTANT_KV, bookId);
      if (!book) {
        return c.json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Book not found'
          }
        }, 400);
      }
    }

    // If book details are provided in the request, use them
    // Otherwise, fetch from the book record
    let finalBookTitle = bookTitle;
    let finalAuthor = author;

    if (bookId && !bookTitle) {
      const book = await getBookById(c.env.READING_ASSISTANT_KV, bookId);
      if (book) {
        finalBookTitle = book.title;
        finalAuthor = book.author;
      }
    }

    if (!finalBookTitle || !finalAuthor) {
      return c.json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Book title and author are required'
        }
      }, 400);
    }

    const session = {
      id: generateId(),
      date,
      bookId: bookId || null,
      bookTitle: finalBookTitle,
      author: finalAuthor,
      assessment: assessment.trim(),
      notes: notes ? notes.trim() : null,
      environment,
      studentId,
      bookPreference: bookPreference || null
    };

    const savedSession = await saveSession(c.env.READING_ASSISTANT_KV, session);
    return c.json({
      data: savedSession,
      message: 'Reading session created successfully'
    }, 201);
  } catch (error) {
    console.error('Error creating session:', error);
    return c.json({
      error: {
        code: 'CREATE_ERROR',
        message: 'Failed to create reading session'
      }
    }, 500);
  }
});

// GET /api/sessions/:id - Get session by ID
app.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const sessions = await getSessions(c.env.READING_ASSISTANT_KV);
    const session = sessions.find(s => s.id === id);

    if (!session) {
      return c.json({
        error: {
          code: 'NOT_FOUND',
          message: 'Session not found'
        }
      }, 404);
    }

    return c.json({ data: session });
  } catch (error) {
    console.error('Error fetching session:', error);
    return c.json({
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch session'
      }
    }, 500);
  }
});

// PUT /api/sessions/:id - Update session
app.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const updates = await c.req.json();

    const sessions = await getSessions(c.env.READING_ASSISTANT_KV);
    const existingSession = sessions.find(s => s.id === id);

    if (!existingSession) {
      return c.json({
        error: {
          code: 'NOT_FOUND',
          message: 'Session not found'
        }
      }, 404);
    }

    // Validate environment if provided
    if (updates.environment && !['school', 'home'].includes(updates.environment)) {
      return c.json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Environment must be either "school" or "home"'
        }
      }, 400);
    }

    // Validate student if studentId is being changed
    if (updates.studentId) {
      const student = await getStudentById(c.env.READING_ASSISTANT_KV, updates.studentId);
      if (!student) {
        return c.json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Student not found'
          }
        }, 400);
      }
    }

    // Validate book if bookId is being changed
    if (updates.bookId) {
      const book = await getBookById(c.env.READING_ASSISTANT_KV, updates.bookId);
      if (!book) {
        return c.json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Book not found'
          }
        }, 400);
      }

      // Update book details if bookId changed
      if (book) {
        updates.bookTitle = book.title;
        updates.author = book.author;
      }
    }

    const updatedSession = {
      ...existingSession,
      ...updates
    };

    // Remove the session from storage and re-add it
    await deleteSession(c.env.READING_ASSISTANT_KV, id);
    const savedSession = await saveSession(c.env.READING_ASSISTANT_KV, updatedSession);

    return c.json({
      data: savedSession,
      message: 'Session updated successfully'
    });
  } catch (error) {
    console.error('Error updating session:', error);
    return c.json({
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to update session'
      }
    }, 500);
  }
});

// DELETE /api/sessions/:id - Delete session
app.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();

    const sessions = await getSessions(c.env.READING_ASSISTANT_KV);
    const existingSession = sessions.find(s => s.id === id);

    if (!existingSession) {
      return c.json({
        error: {
          code: 'NOT_FOUND',
          message: 'Session not found'
        }
      }, 404);
    }

    await deleteSession(c.env.READING_ASSISTANT_KV, id);
    return c.json({
      message: 'Session deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting session:', error);
    return c.json({
      error: {
        code: 'DELETE_ERROR',
        message: 'Failed to delete session'
      }
    }, 500);
  }
});

// GET /api/sessions/student/:id - Get sessions by student
app.get('/student/:id', async (c) => {
  try {
    const { id } = c.req.param();

    // Validate student exists
    const student = await getStudentById(c.env.READING_ASSISTANT_KV, id);
    if (!student) {
      return c.json({
        error: {
          code: 'NOT_FOUND',
          message: 'Student not found'
        }
      }, 404);
    }

    const sessions = await getSessionsByStudent(c.env.READING_ASSISTANT_KV, id);
    return c.json({ data: sessions });
  } catch (error) {
    console.error('Error fetching student sessions:', error);
    return c.json({
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch student sessions'
      }
    }, 500);
  }
});

export default app;