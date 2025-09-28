/**
 * Student API Routes
 * Handles all student-related operations
 */

import { Hono } from 'hono';
import {
  getStudents,
  getStudentById,
  saveStudent,
  deleteStudent,
  generateId
} from '../data/kvProvider.js';

const app = new Hono();

// GET /api/students - List all students
app.get('/', async (c) => {
  try {
    const students = await getStudents(c.env.READING_ASSISTANT_KV);
    return c.json({ data: students });
  } catch (error) {
    console.error('Error fetching students:', error);
    return c.json({
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch students'
      }
    }, 500);
  }
});

// POST /api/students - Create new student
app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { name, classId, readingLevel, preferences } = body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return c.json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Student name is required'
        }
      }, 400);
    }

    // Check if student with this name already exists
    const existingStudents = await getStudents(c.env.READING_ASSISTANT_KV);
    const duplicate = existingStudents.find(s => s.name.toLowerCase() === name.toLowerCase().trim());
    if (duplicate) {
      return c.json({
        error: {
          code: 'DUPLICATE_ERROR',
          message: 'A student with this name already exists'
        }
      }, 409);
    }

    const student = {
      id: generateId(),
      name: name.trim(),
      classId: classId || null,
      readingLevel: readingLevel || null,
      lastReadDate: null,
      preferences: {
        favoriteGenreIds: [],
        likes: [],
        dislikes: [],
        readingFormats: [],
        ...preferences
      },
      readingSessions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const savedStudent = await saveStudent(c.env.READING_ASSISTANT_KV, student);
    return c.json({
      data: savedStudent,
      message: 'Student created successfully'
    }, 201);
  } catch (error) {
    console.error('Error creating student:', error);
    return c.json({
      error: {
        code: 'CREATE_ERROR',
        message: 'Failed to create student'
      }
    }, 500);
  }
});

// GET /api/students/:id - Get student by ID
app.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const student = await getStudentById(c.env.READING_ASSISTANT_KV, id);

    if (!student) {
      return c.json({
        error: {
          code: 'NOT_FOUND',
          message: 'Student not found'
        }
      }, 404);
    }

    return c.json({ data: student });
  } catch (error) {
    console.error('Error fetching student:', error);
    return c.json({
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch student'
      }
    }, 500);
  }
});

// PUT /api/students/:id - Update student
app.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const updates = await c.req.json();

    const existingStudent = await getStudentById(c.env.READING_ASSISTANT_KV, id);
    if (!existingStudent) {
      return c.json({
        error: {
          code: 'NOT_FOUND',
          message: 'Student not found'
        }
      }, 404);
    }

    // Validate name if provided
    if (updates.name !== undefined) {
      if (typeof updates.name !== 'string' || updates.name.trim().length === 0) {
        return c.json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Student name must be a non-empty string'
          }
        }, 400);
      }

      // Check for duplicate names (excluding current student)
      const allStudents = await getStudents(c.env.READING_ASSISTANT_KV);
      const duplicate = allStudents.find(s =>
        s.id !== id && s.name.toLowerCase() === updates.name.toLowerCase().trim()
      );
      if (duplicate) {
        return c.json({
          error: {
            code: 'DUPLICATE_ERROR',
            message: 'Another student with this name already exists'
          }
        }, 409);
      }
      updates.name = updates.name.trim();
    }

    const updatedStudent = {
      ...existingStudent,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const savedStudent = await saveStudent(c.env.READING_ASSISTANT_KV, updatedStudent);
    return c.json({
      data: savedStudent,
      message: 'Student updated successfully'
    });
  } catch (error) {
    console.error('Error updating student:', error);
    return c.json({
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to update student'
      }
    }, 500);
  }
});

// DELETE /api/students/:id - Delete student
app.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();

    const existingStudent = await getStudentById(c.env.READING_ASSISTANT_KV, id);
    if (!existingStudent) {
      return c.json({
        error: {
          code: 'NOT_FOUND',
          message: 'Student not found'
        }
      }, 404);
    }

    await deleteStudent(c.env.READING_ASSISTANT_KV, id);
    return c.json({
      message: 'Student deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting student:', error);
    return c.json({
      error: {
        code: 'DELETE_ERROR',
        message: 'Failed to delete student'
      }
    }, 500);
  }
});

// POST /api/students/bulk - Bulk import students
app.post('/bulk', async (c) => {
  try {
    const body = await c.req.json();
    const { students } = body;

    if (!Array.isArray(students)) {
      return c.json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Students must be an array'
        }
      }, 400);
    }

    const createdStudents = [];
    const errors = [];

    for (const studentData of students) {
      try {
        const student = {
          id: generateId(),
          name: studentData.name?.trim(),
          classId: studentData.classId || null,
          readingLevel: studentData.readingLevel || null,
          lastReadDate: null,
          preferences: {
            favoriteGenreIds: [],
            likes: [],
            dislikes: [],
            readingFormats: [],
            ...studentData.preferences
          },
          readingSessions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Validation
        if (!student.name || student.name.length === 0) {
          errors.push(`Student missing name: ${JSON.stringify(studentData)}`);
          continue;
        }

        const savedStudent = await saveStudent(c.env.READING_ASSISTANT_KV, student);
        createdStudents.push(savedStudent);
      } catch (error) {
        errors.push(`Error creating student ${studentData.name}: ${error.message}`);
      }
    }

    return c.json({
      data: {
        created: createdStudents,
        errors
      },
      message: `Created ${createdStudents.length} students${errors.length > 0 ? `, ${errors.length} errors` : ''}`
    }, createdStudents.length > 0 ? 201 : 400);
  } catch (error) {
    console.error('Error bulk importing students:', error);
    return c.json({
      error: {
        code: 'BULK_IMPORT_ERROR',
        message: 'Failed to import students'
      }
    }, 500);
  }
});

export default app;