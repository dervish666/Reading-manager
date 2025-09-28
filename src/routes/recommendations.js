/**
 * Recommendations API Routes
 * Handles AI-powered book recommendations
 */

import { Hono } from 'hono';
import {
  getStudentById,
  getBooks,
  getGenres,
  getSessionsByStudent
} from '../data/kvProvider.js';

const app = new Hono();

// POST /api/recommendations - Get AI book recommendations
app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { studentId, limit = 5 } = body;

    // Validation
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
          code: 'NOT_FOUND',
          message: 'Student not found'
        }
      }, 404);
    }

    // Get student's reading history and preferences
    const sessions = await getSessionsByStudent(c.env.READING_ASSISTANT_KV, studentId);
    const allBooks = await getBooks(c.env.READING_ASSISTANT_KV);
    const genres = await getGenres(c.env.READING_ASSISTANT_KV);

    // Get books the student has already read
    const readBookIds = new Set(sessions.map(session => session.bookId).filter(Boolean));

    // Create a simple recommendation algorithm (since we don't have Anthropic API key in this context)
    // In a real implementation, you would call the Anthropic Claude API here
    const recommendations = await generateRecommendations(
      student,
      sessions,
      allBooks,
      genres,
      readBookIds,
      limit
    );

    return c.json({
      data: recommendations,
      message: 'Recommendations generated successfully'
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return c.json({
      error: {
        code: 'RECOMMENDATION_ERROR',
        message: 'Failed to generate recommendations'
      }
    }, 500);
  }
});

/**
 * Generates book recommendations for a student
 * This is a simplified algorithm - in production, you would use Anthropic Claude API
 */
async function generateRecommendations(student, sessions, allBooks, genres, readBookIds, limit) {
  const recommendations = [];
  const studentPreferences = student.preferences || {};

  // Filter out already read books
  const unreadBooks = allBooks.filter(book => !readBookIds.has(book.id));

  // Score books based on various factors
  const scoredBooks = unreadBooks.map(book => {
    let score = 0;

    // Genre preference scoring
    if (studentPreferences.favoriteGenreIds && studentPreferences.favoriteGenreIds.length > 0) {
      const matchingGenres = book.genreIds.filter(genreId =>
        studentPreferences.favoriteGenreIds.includes(genreId)
      );
      score += matchingGenres.length * 3; // 3 points per matching favorite genre
    }

    // Avoid disliked genres
    if (studentPreferences.dislikes && studentPreferences.dislikes.length > 0) {
      const dislikedGenres = genres.filter(genre =>
        studentPreferences.dislikes.some(dislike =>
          genre.name.toLowerCase().includes(dislike.toLowerCase())
        )
      );
      const dislikedGenreIds = dislikedGenres.map(g => g.id);
      const hasDislikedGenre = book.genreIds.some(genreId => dislikedGenreIds.includes(genreId));
      if (hasDislikedGenre) {
        score -= 5; // Penalty for disliked genres
      }
    }

    // Reading level matching (if both have reading levels)
    if (student.readingLevel && book.readingLevel) {
      if (student.readingLevel === book.readingLevel) {
        score += 2; // Bonus for matching reading level
      }
    }

    // Age range consideration
    if (book.ageRange) {
      // This is a simplified age range check
      // In a real implementation, you'd parse age ranges more carefully
      score += 1; // Small bonus for having age range info
    }

    // Recency bonus for books that haven't been read by many students
    // This is a simple heuristic
    score += Math.random() * 2; // Add some randomness to vary recommendations

    return { book, score };
  });

  // Sort by score and return top recommendations
  scoredBooks.sort((a, b) => b.score - a.score);

  return scoredBooks.slice(0, limit).map(item => ({
    book: item.book,
    score: item.score,
    reasoning: generateReasoning(student, item.book, genres, studentPreferences)
  }));
}

/**
 * Generates human-readable reasoning for a recommendation
 */
function generateReasoning(student, book, genres, preferences) {
  const reasons = [];

  // Check for favorite genres
  if (preferences.favoriteGenreIds && preferences.favoriteGenreIds.length > 0) {
    const bookGenres = genres.filter(g => book.genreIds.includes(g.id));
    const favoriteGenres = genres.filter(g => preferences.favoriteGenreIds.includes(g.id));
    const matchingGenres = bookGenres.filter(bg =>
      favoriteGenres.some(fg => fg.id === bg.id)
    );

    if (matchingGenres.length > 0) {
      reasons.push(`Matches favorite genre: ${matchingGenres.map(g => g.name).join(', ')}`);
    }
  }

  // Reading level match
  if (student.readingLevel && book.readingLevel && student.readingLevel === book.readingLevel) {
    reasons.push(`Matches current reading level: ${student.readingLevel}`);
  }

  // Age appropriateness
  if (book.ageRange) {
    reasons.push(`Age appropriate content`);
  }

  // Default reason if no specific matches
  if (reasons.length === 0) {
    const bookGenres = genres.filter(g => book.genreIds.includes(g.id));
    if (bookGenres.length > 0) {
      reasons.push(`Features ${bookGenres.map(g => g.name).join(', ')} genre`);
    } else {
      reasons.push('Recommended based on general appeal');
    }
  }

  return reasons;
}

export default app;