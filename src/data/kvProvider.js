/**
 * Cloudflare KV Storage Provider
 * Handles all data operations for the Kids Reading Manager application
 */

// ====================
// Type Definitions
// ====================

/**
 * @typedef {Object} Student
 * @property {string} id
 * @property {string} name
 * @property {string|null} classId
 * @property {string|null} readingLevel
 * @property {string|null} lastReadDate
 * @property {Object} preferences
 * @property {string[]} preferences.favoriteGenreIds
 * @property {string[]} preferences.likes
 * @property {string[]} preferences.dislikes
 * @property {string[]} preferences.readingFormats
 * @property {ReadingSession[]} readingSessions
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} Class
 * @property {string} id
 * @property {string} name
 * @property {string|null} teacherName
 * @property {string|null} schoolYear
 * @property {boolean} disabled
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} Book
 * @property {string} id
 * @property {string} title
 * @property {string} author
 * @property {string[]} genreIds
 * @property {string|null} readingLevel
 * @property {string|null} ageRange
 */

/**
 * @typedef {Object} Genre
 * @property {string} id
 * @property {string} name
 * @property {string|null} description
 * @property {boolean} isPredefined
 */

/**
 * @typedef {Object} ReadingSession
 * @property {string} id
 * @property {string} date
 * @property {string} bookId
 * @property {string} bookTitle
 * @property {string} author
 * @property {string} assessment
 * @property {string|null} notes
 * @property {'school'|'home'} environment
 * @property {string} studentId
 */

/**
 * @typedef {Object} Settings
 * @property {Object} readingStatusSettings
 * @property {number} readingStatusSettings.recentlyReadDays
 * @property {number} readingStatusSettings.needsAttentionDays
 */

// ====================
// UUID Generation Utility
// ====================

/**
 * Generates a UUID v4 using Web Crypto API
 * @returns {string} UUID v4 string
 */
export function generateId() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);

  // Set version (4) and variant bits
  array[6] = (array[6] & 0x0f) | 0x40;
  array[8] = (array[8] & 0x3f) | 0x80;

  const hex = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20,32)}`;
}

// ====================
// Storage Key Utilities
// ====================

const KEY_PREFIXES = {
  students: 'student:',
  classes: 'class:',
  books: 'book:',
  genres: 'genre:',
  sessions: 'session:',
  settings: 'settings',
  indexes: 'index:'
};

/**
 * Generates a storage key for a given entity type and ID
 * @param {string} type - Entity type (students, classes, books, etc.)
 * @param {string} id - Entity ID
 * @returns {string} Storage key
 */
function makeKey(type, id) {
  const prefix = KEY_PREFIXES[type];
  if (!prefix) {
    throw new Error(`Unknown entity type: ${type}`);
  }
  return `${prefix}${id}`;
}

// ====================
// Index Management
// ====================

/**
 * Updates an index with a new entity ID
 * @param {KVNamespace} kv - KV namespace
 * @param {string} type - Entity type
 * @param {string} id - Entity ID to add
 */
async function updateIndex(kv, type, id) {
  const indexKey = `index:${type}`;
  const existing = await kv.get(indexKey);
  const ids = existing ? JSON.parse(existing) : [];

  if (!ids.includes(id)) {
    ids.push(id);
    await kv.put(indexKey, JSON.stringify(ids));
  }
}

/**
 * Removes an ID from an index
 * @param {KVNamespace} kv - KV namespace
 * @param {string} type - Entity type
 * @param {string} id - Entity ID to remove
 */
async function removeFromIndex(kv, type, id) {
  const indexKey = `index:${type}`;
  const existing = await kv.get(indexKey);
  if (!existing) return;

  const ids = JSON.parse(existing).filter(existingId => existingId !== id);
  await kv.put(indexKey, JSON.stringify(ids));
}

// ====================
// Student Operations
// ====================

/**
 * Gets all students from KV storage
 * @param {KVNamespace} kv - KV namespace
 * @returns {Promise<Student[]>}
 */
export async function getStudents(kv) {
  const index = await kv.get('index:students');
  const ids = index ? JSON.parse(index) : [];

  const students = [];
  for (const id of ids) {
    const student = await kv.get(makeKey('students', id));
    if (student) {
      const parsed = JSON.parse(student);
      // Ensure readingSessions is properly formatted
      if (!parsed.readingSessions) {
        parsed.readingSessions = [];
      }
      students.push(parsed);
    }
  }
  return students;
}

/**
 * Gets a student by ID
 * @param {KVNamespace} kv - KV namespace
 * @param {string} id - Student ID
 * @returns {Promise<Student|null>}
 */
export async function getStudentById(kv, id) {
  const student = await kv.get(makeKey('students', id));
  return student ? JSON.parse(student) : null;
}

/**
 * Saves a student to KV storage
 * @param {KVNamespace} kv - KV namespace
 * @param {Student} student - Student to save
 * @returns {Promise<Student>}
 */
export async function saveStudent(kv, student) {
  const now = new Date().toISOString();
  const studentWithTimestamps = {
    ...student,
    updatedAt: now,
    createdAt: student.createdAt || now
  };

  await kv.put(makeKey('students', student.id), JSON.stringify(studentWithTimestamps));
  await updateIndex(kv, 'students', student.id);

  return studentWithTimestamps;
}

/**
 * Deletes a student from KV storage
 * @param {KVNamespace} kv - KV namespace
 * @param {string} id - Student ID to delete
 * @returns {Promise<boolean>}
 */
export async function deleteStudent(kv, id) {
  await kv.delete(makeKey('students', id));
  await removeFromIndex(kv, 'students', id);
  return true;
}

// ====================
// Class Operations
// ====================

/**
 * Gets all classes from KV storage
 * @param {KVNamespace} kv - KV namespace
 * @returns {Promise<Class[]>}
 */
export async function getClasses(kv) {
  const index = await kv.get('index:classes');
  const ids = index ? JSON.parse(index) : [];

  const classes = [];
  for (const id of ids) {
    const classData = await kv.get(makeKey('classes', id));
    if (classData) classes.push(JSON.parse(classData));
  }
  return classes;
}

/**
 * Gets a class by ID
 * @param {KVNamespace} kv - KV namespace
 * @param {string} id - Class ID
 * @returns {Promise<Class|null>}
 */
export async function getClassById(kv, id) {
  const classData = await kv.get(makeKey('classes', id));
  return classData ? JSON.parse(classData) : null;
}

/**
 * Saves a class to KV storage
 * @param {KVNamespace} kv - KV namespace
 * @param {Class} classData - Class to save
 * @returns {Promise<Class>}
 */
export async function saveClass(kv, classData) {
  const now = new Date().toISOString();
  const classWithTimestamps = {
    ...classData,
    updatedAt: now,
    createdAt: classData.createdAt || now
  };

  await kv.put(makeKey('classes', classData.id), JSON.stringify(classWithTimestamps));
  await updateIndex(kv, 'classes', classData.id);

  return classWithTimestamps;
}

/**
 * Deletes a class from KV storage
 * @param {KVNamespace} kv - KV namespace
 * @param {string} id - Class ID to delete
 * @returns {Promise<boolean>}
 */
export async function deleteClass(kv, id) {
  await kv.delete(makeKey('classes', id));
  await removeFromIndex(kv, 'classes', id);
  return true;
}

// ====================
// Book Operations
// ====================

/**
 * Gets all books from KV storage
 * @param {KVNamespace} kv - KV namespace
 * @returns {Promise<Book[]>}
 */
export async function getBooks(kv) {
  const index = await kv.get('index:books');
  const ids = index ? JSON.parse(index) : [];

  const books = [];
  for (const id of ids) {
    const book = await kv.get(makeKey('books', id));
    if (book) books.push(JSON.parse(book));
  }
  return books;
}

/**
 * Gets a book by ID
 * @param {KVNamespace} kv - KV namespace
 * @param {string} id - Book ID
 * @returns {Promise<Book|null>}
 */
export async function getBookById(kv, id) {
  const book = await kv.get(makeKey('books', id));
  return book ? JSON.parse(book) : null;
}

/**
 * Saves a book to KV storage
 * @param {KVNamespace} kv - KV namespace
 * @param {Book} book - Book to save
 * @returns {Promise<Book>}
 */
export async function saveBook(kv, book) {
  await kv.put(makeKey('books', book.id), JSON.stringify(book));
  await updateIndex(kv, 'books', book.id);
  return book;
}

/**
 * Deletes a book from KV storage
 * @param {KVNamespace} kv - KV namespace
 * @param {string} id - Book ID to delete
 * @returns {Promise<boolean>}
 */
export async function deleteBook(kv, id) {
  await kv.delete(makeKey('books', id));
  await removeFromIndex(kv, 'books', id);
  return true;
}

// ====================
// Genre Operations
// ====================

/**
 * Gets all genres from KV storage
 * @param {KVNamespace} kv - KV namespace
 * @returns {Promise<Genre[]>}
 */
export async function getGenres(kv) {
  const index = await kv.get('index:genres');
  const ids = index ? JSON.parse(index) : [];

  const genres = [];
  for (const id of ids) {
    const genre = await kv.get(makeKey('genres', id));
    if (genre) genres.push(JSON.parse(genre));
  }
  return genres;
}

/**
 * Gets a genre by ID
 * @param {KVNamespace} kv - KV namespace
 * @param {string} id - Genre ID
 * @returns {Promise<Genre|null>}
 */
export async function getGenreById(kv, id) {
  const genre = await kv.get(makeKey('genres', id));
  return genre ? JSON.parse(genre) : null;
}

/**
 * Saves a genre to KV storage
 * @param {KVNamespace} kv - KV namespace
 * @param {Genre} genre - Genre to save
 * @returns {Promise<Genre>}
 */
export async function saveGenre(kv, genre) {
  await kv.put(makeKey('genres', genre.id), JSON.stringify(genre));
  await updateIndex(kv, 'genres', genre.id);
  return genre;
}

/**
 * Deletes a genre from KV storage
 * @param {KVNamespace} kv - KV namespace
 * @param {string} id - Genre ID to delete
 * @returns {Promise<boolean>}
 */
export async function deleteGenre(kv, id) {
  await kv.delete(makeKey('genres', id));
  await removeFromIndex(kv, 'genres', id);
  return true;
}

// ====================
// Reading Session Operations
// ====================

/**
 * Gets all reading sessions from KV storage
 * @param {KVNamespace} kv - KV namespace
 * @returns {Promise<ReadingSession[]>}
 */
export async function getSessions(kv) {
  const index = await kv.get('index:sessions');
  const ids = index ? JSON.parse(index) : [];

  const sessions = [];
  for (const id of ids) {
    const session = await kv.get(makeKey('sessions', id));
    if (session) sessions.push(JSON.parse(session));
  }
  return sessions;
}

/**
 * Gets sessions for a specific student
 * @param {KVNamespace} kv - KV namespace
 * @param {string} studentId - Student ID
 * @returns {Promise<ReadingSession[]>}
 */
export async function getSessionsByStudent(kv, studentId) {
  const sessions = await getSessions(kv);
  return sessions.filter(session => session.studentId === studentId);
}

/**
 * Saves a reading session to KV storage
 * @param {KVNamespace} kv - KV namespace
 * @param {ReadingSession} session - Session to save
 * @returns {Promise<ReadingSession>}
 */
export async function saveSession(kv, session) {
  await kv.put(makeKey('sessions', session.id), JSON.stringify(session));
  await updateIndex(kv, 'sessions', session.id);

  // Update student's last read date
  const student = await getStudentById(kv, session.studentId);
  if (student) {
    await saveStudent(kv, { ...student, lastReadDate: session.date });
  }

  return session;
}

/**
 * Deletes a reading session from KV storage
 * @param {KVNamespace} kv - KV namespace
 * @param {string} id - Session ID to delete
 * @returns {Promise<boolean>}
 */
export async function deleteSession(kv, id) {
  await kv.delete(makeKey('sessions', id));
  await removeFromIndex(kv, 'sessions', id);
  return true;
}

// ====================
// Settings Operations
// ====================

/**
 * Gets application settings
 * @param {KVNamespace} kv - KV namespace
 * @returns {Promise<Settings|null>}
 */
export async function getSettings(kv) {
  const settings = await kv.get('settings');
  return settings ? JSON.parse(settings) : null;
}

/**
 * Saves application settings
 * @param {KVNamespace} kv - KV namespace
 * @param {Settings} settings - Settings to save
 * @returns {Promise<Settings>}
 */
export async function saveSettings(kv, settings) {
  await kv.put('settings', JSON.stringify(settings));
  return settings;
}

// ====================
// Default Data Initialization
// ====================

/**
 * Initializes default genres if none exist
 * @param {KVNamespace} kv - KV namespace
 */
export async function initializeDefaultGenres(kv) {
  const existingGenres = await getGenres(kv);
  if (existingGenres.length > 0) return;

  const defaultGenres = [
    { id: generateId(), name: 'Adventure', description: 'Exciting stories with exploration and discovery', isPredefined: true },
    { id: generateId(), name: 'Fantasy', description: 'Magical worlds and mythical creatures', isPredefined: true },
    { id: generateId(), name: 'Mystery', description: 'Puzzles, detectives, and suspense', isPredefined: true },
    { id: generateId(), name: 'Science Fiction', description: 'Future worlds and space exploration', isPredefined: true },
    { id: generateId(), name: 'Animal Stories', description: 'Stories about animals and their adventures', isPredefined: true },
    { id: generateId(), name: 'Friendship', description: 'Stories about relationships and social themes', isPredefined: true },
    { id: generateId(), name: 'Family', description: 'Stories about families and home life', isPredefined: true },
    { id: generateId(), name: 'School', description: 'Stories about school experiences and learning', isPredefined: true },
    { id: generateId(), name: 'Sports', description: 'Athletic competitions and teamwork', isPredefined: true },
    { id: generateId(), name: 'Humor', description: 'Funny stories that make you laugh', isPredefined: true }
  ];

  for (const genre of defaultGenres) {
    await saveGenre(kv, genre);
  }
}

/**
 * Initializes default settings if none exist
 * @param {KVNamespace} kv - KV namespace
 */
export async function initializeDefaultSettings(kv) {
  const existingSettings = await getSettings(kv);
  if (existingSettings) return;

  const defaultSettings = {
    readingStatusSettings: {
      recentlyReadDays: 7,
      needsAttentionDays: 14
    }
  };

  await saveSettings(kv, defaultSettings);
}