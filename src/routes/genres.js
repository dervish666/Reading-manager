/**
 * Genre API Routes
 * Handles all genre-related operations
 */

import { Hono } from 'hono';
import {
  getGenres,
  getGenreById,
  saveGenre,
  deleteGenre,
  generateId
} from '../data/kvProvider.js';

const app = new Hono();

// GET /api/genres - List all genres
app.get('/', async (c) => {
  try {
    const genres = await getGenres(c.env.READING_ASSISTANT_KV);
    return c.json({ data: genres });
  } catch (error) {
    console.error('Error fetching genres:', error);
    return c.json({
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch genres'
      }
    }, 500);
  }
});

// POST /api/genres - Create new genre
app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { name, description, isPredefined } = body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return c.json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Genre name is required'
        }
      }, 400);
    }

    // Check if genre with this name already exists
    const existingGenres = await getGenres(c.env.READING_ASSISTANT_KV);
    const duplicate = existingGenres.find(g => g.name.toLowerCase() === name.toLowerCase().trim());
    if (duplicate) {
      return c.json({
        error: {
          code: 'DUPLICATE_ERROR',
          message: 'A genre with this name already exists'
        }
      }, 409);
    }

    const genre = {
      id: generateId(),
      name: name.trim(),
      description: description || null,
      isPredefined: isPredefined || false
    };

    const savedGenre = await saveGenre(c.env.READING_ASSISTANT_KV, genre);
    return c.json({
      data: savedGenre,
      message: 'Genre created successfully'
    }, 201);
  } catch (error) {
    console.error('Error creating genre:', error);
    return c.json({
      error: {
        code: 'CREATE_ERROR',
        message: 'Failed to create genre'
      }
    }, 500);
  }
});

// GET /api/genres/:id - Get genre by ID
app.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const genre = await getGenreById(c.env.READING_ASSISTANT_KV, id);

    if (!genre) {
      return c.json({
        error: {
          code: 'NOT_FOUND',
          message: 'Genre not found'
        }
      }, 404);
    }

    return c.json({ data: genre });
  } catch (error) {
    console.error('Error fetching genre:', error);
    return c.json({
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch genre'
      }
    }, 500);
  }
});

// PUT /api/genres/:id - Update genre
app.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const updates = await c.req.json();

    const existingGenre = await getGenreById(c.env.READING_ASSISTANT_KV, id);
    if (!existingGenre) {
      return c.json({
        error: {
          code: 'NOT_FOUND',
          message: 'Genre not found'
        }
      }, 404);
    }

    // Don't allow editing predefined genres
    if (existingGenre.isPredefined) {
      return c.json({
        error: {
          code: 'FORBIDDEN',
          message: 'Cannot edit predefined genres'
        }
      }, 403);
    }

    // Validate name if provided
    if (updates.name !== undefined) {
      if (typeof updates.name !== 'string' || updates.name.trim().length === 0) {
        return c.json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Genre name must be a non-empty string'
          }
        }, 400);
      }

      // Check for duplicate names (excluding current genre)
      const allGenres = await getGenres(c.env.READING_ASSISTANT_KV);
      const duplicate = allGenres.find(g =>
        g.id !== id && g.name.toLowerCase() === updates.name.toLowerCase().trim()
      );
      if (duplicate) {
        return c.json({
          error: {
            code: 'DUPLICATE_ERROR',
            message: 'Another genre with this name already exists'
          }
        }, 409);
      }
      updates.name = updates.name.trim();
    }

    const updatedGenre = {
      ...existingGenre,
      ...updates
    };

    const savedGenre = await saveGenre(c.env.READING_ASSISTANT_KV, updatedGenre);
    return c.json({
      data: savedGenre,
      message: 'Genre updated successfully'
    });
  } catch (error) {
    console.error('Error updating genre:', error);
    return c.json({
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to update genre'
      }
    }, 500);
  }
});

// DELETE /api/genres/:id - Delete genre
app.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();

    const existingGenre = await getGenreById(c.env.READING_ASSISTANT_KV, id);
    if (!existingGenre) {
      return c.json({
        error: {
          code: 'NOT_FOUND',
          message: 'Genre not found'
        }
      }, 404);
    }

    // Don't allow deleting predefined genres
    if (existingGenre.isPredefined) {
      return c.json({
        error: {
          code: 'FORBIDDEN',
          message: 'Cannot delete predefined genres'
        }
      }, 403);
    }

    await deleteGenre(c.env.READING_ASSISTANT_KV, id);
    return c.json({
      message: 'Genre deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting genre:', error);
    return c.json({
      error: {
        code: 'DELETE_ERROR',
        message: 'Failed to delete genre'
      }
    }, 500);
  }
});

export default app;