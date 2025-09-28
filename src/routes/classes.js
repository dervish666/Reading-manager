/**
 * Class API Routes
 * Handles all class-related operations
 */

import { Hono } from 'hono';
import {
  getClasses,
  getClassById,
  saveClass,
  deleteClass,
  generateId
} from '../data/kvProvider.js';

const app = new Hono();

// GET /api/classes - List all classes
app.get('/', async (c) => {
  try {
    const classes = await getClasses(c.env.READING_ASSISTANT_KV);
    return c.json({ data: classes });
  } catch (error) {
    console.error('Error fetching classes:', error);
    return c.json({
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch classes'
      }
    }, 500);
  }
});

// POST /api/classes - Create new class
app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { name, teacherName, schoolYear } = body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return c.json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Class name is required'
        }
      }, 400);
    }

    // Check if class with this name already exists
    const existingClasses = await getClasses(c.env.READING_ASSISTANT_KV);
    const duplicate = existingClasses.find(cls => cls.name.toLowerCase() === name.toLowerCase().trim());
    if (duplicate) {
      return c.json({
        error: {
          code: 'DUPLICATE_ERROR',
          message: 'A class with this name already exists'
        }
      }, 409);
    }

    const classData = {
      id: generateId(),
      name: name.trim(),
      teacherName: teacherName || null,
      schoolYear: schoolYear || null,
      disabled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const savedClass = await saveClass(c.env.READING_ASSISTANT_KV, classData);
    return c.json({
      data: savedClass,
      message: 'Class created successfully'
    }, 201);
  } catch (error) {
    console.error('Error creating class:', error);
    return c.json({
      error: {
        code: 'CREATE_ERROR',
        message: 'Failed to create class'
      }
    }, 500);
  }
});

// GET /api/classes/:id - Get class by ID
app.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const classData = await getClassById(c.env.READING_ASSISTANT_KV, id);

    if (!classData) {
      return c.json({
        error: {
          code: 'NOT_FOUND',
          message: 'Class not found'
        }
      }, 404);
    }

    return c.json({ data: classData });
  } catch (error) {
    console.error('Error fetching class:', error);
    return c.json({
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch class'
      }
    }, 500);
  }
});

// PUT /api/classes/:id - Update class
app.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const updates = await c.req.json();

    const existingClass = await getClassById(c.env.READING_ASSISTANT_KV, id);
    if (!existingClass) {
      return c.json({
        error: {
          code: 'NOT_FOUND',
          message: 'Class not found'
        }
      }, 404);
    }

    // Validate name if provided
    if (updates.name !== undefined) {
      if (typeof updates.name !== 'string' || updates.name.trim().length === 0) {
        return c.json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Class name must be a non-empty string'
          }
        }, 400);
      }

      // Check for duplicate names (excluding current class)
      const allClasses = await getClasses(c.env.READING_ASSISTANT_KV);
      const duplicate = allClasses.find(cls =>
        cls.id !== id && cls.name.toLowerCase() === updates.name.toLowerCase().trim()
      );
      if (duplicate) {
        return c.json({
          error: {
            code: 'DUPLICATE_ERROR',
            message: 'Another class with this name already exists'
          }
        }, 409);
      }
      updates.name = updates.name.trim();
    }

    const updatedClass = {
      ...existingClass,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const savedClass = await saveClass(c.env.READING_ASSISTANT_KV, updatedClass);
    return c.json({
      data: savedClass,
      message: 'Class updated successfully'
    });
  } catch (error) {
    console.error('Error updating class:', error);
    return c.json({
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to update class'
      }
    }, 500);
  }
});

// DELETE /api/classes/:id - Delete class
app.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();

    const existingClass = await getClassById(c.env.READING_ASSISTANT_KV, id);
    if (!existingClass) {
      return c.json({
        error: {
          code: 'NOT_FOUND',
          message: 'Class not found'
        }
      }, 404);
    }

    await deleteClass(c.env.READING_ASSISTANT_KV, id);
    return c.json({
      message: 'Class deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting class:', error);
    return c.json({
      error: {
        code: 'DELETE_ERROR',
        message: 'Failed to delete class'
      }
    }, 500);
  }
});

export default app;