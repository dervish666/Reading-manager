/**
 * App Context - Global State Management
 * Provides API access and state management for the React application
 */

import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Initial state
const initialState = {
  // UI State
  selectedClassFilter: localStorage.getItem('selectedClassFilter') || '',

  // Data
  students: [],
  classes: [],
  books: [],
  genres: [],
  sessions: [],
  settings: null,

  // UI state
  loading: false,
  error: null,

  // Filters and search
  filters: {
    students: {},
    sessions: {},
    books: {}
  },

  // Sorting state
  sorting: {
    students: {
      column: null,
      direction: null
    },
    sessions: {
      column: null,
      direction: null
    },
    books: {
      column: null,
      direction: null
    }
  },

  // Loading states for specific operations
  sortingLoading: {
    students: false,
    sessions: false,
    books: false
  }
};

// Action types
const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_SELECTED_CLASS_FILTER: 'SET_SELECTED_CLASS_FILTER',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',

  // Data actions
  SET_STUDENTS: 'SET_STUDENTS',
  ADD_STUDENT: 'ADD_STUDENT',
  UPDATE_STUDENT: 'UPDATE_STUDENT',
  DELETE_STUDENT: 'DELETE_STUDENT',

  SET_CLASSES: 'SET_CLASSES',
  ADD_CLASS: 'ADD_CLASS',
  UPDATE_CLASS: 'UPDATE_CLASS',
  DELETE_CLASS: 'DELETE_CLASS',

  SET_BOOKS: 'SET_BOOKS',
  ADD_BOOK: 'ADD_BOOK',
  UPDATE_BOOK: 'UPDATE_BOOK',
  DELETE_BOOK: 'DELETE_BOOK',

  SET_GENRES: 'SET_GENRES',
  ADD_GENRE: 'ADD_GENRE',
  UPDATE_GENRE: 'UPDATE_GENRE',
  DELETE_GENRE: 'DELETE_GENRE',

  SET_SESSIONS: 'SET_SESSIONS',
  ADD_SESSION: 'ADD_SESSION',
  UPDATE_SESSION: 'UPDATE_SESSION',
  DELETE_SESSION: 'DELETE_SESSION',

  SET_SETTINGS: 'SET_SETTINGS',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',

  // Filter actions
  SET_FILTER: 'SET_FILTER',
  CLEAR_FILTERS: 'CLEAR_FILTERS',

  // Sorting actions
  SET_SORT: 'SET_SORT',
  CLEAR_SORT: 'CLEAR_SORT',
  SET_SORTING_LOADING: 'SET_SORTING_LOADING'
};

// Reducer function
function appReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };

    case ACTIONS.SET_SELECTED_CLASS_FILTER:
      // Persist to localStorage
      if (action.payload) {
        localStorage.setItem('selectedClassFilter', action.payload);
      } else {
        localStorage.removeItem('selectedClassFilter');
      }
      return { ...state, selectedClassFilter: action.payload };

    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };

    case ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };

    case ACTIONS.SET_STUDENTS:
      return { ...state, students: action.payload };

    case ACTIONS.ADD_STUDENT:
      return { ...state, students: [...state.students, action.payload] };

    case ACTIONS.UPDATE_STUDENT:
      return {
        ...state,
        students: state.students.map(student =>
          student.id === action.payload.id ? action.payload : student
        )
      };

    case ACTIONS.DELETE_STUDENT:
      return {
        ...state,
        students: state.students.filter(student => student.id !== action.payload)
      };

    case ACTIONS.SET_CLASSES:
      return { ...state, classes: action.payload };

    case ACTIONS.ADD_CLASS:
      return { ...state, classes: [...state.classes, action.payload] };

    case ACTIONS.UPDATE_CLASS:
      return {
        ...state,
        classes: state.classes.map(cls =>
          cls.id === action.payload.id ? action.payload : cls
        )
      };

    case ACTIONS.DELETE_CLASS:
      return {
        ...state,
        classes: state.classes.filter(cls => cls.id !== action.payload)
      };

    case ACTIONS.SET_BOOKS:
      return { ...state, books: action.payload };

    case ACTIONS.ADD_BOOK:
      return { ...state, books: [...state.books, action.payload] };

    case ACTIONS.UPDATE_BOOK:
      return {
        ...state,
        books: state.books.map(book =>
          book.id === action.payload.id ? action.payload : book
        )
      };

    case ACTIONS.DELETE_BOOK:
      return {
        ...state,
        books: state.books.filter(book => book.id !== action.payload)
      };

    case ACTIONS.SET_GENRES:
      return { ...state, genres: action.payload };

    case ACTIONS.ADD_GENRE:
      return { ...state, genres: [...state.genres, action.payload] };

    case ACTIONS.UPDATE_GENRE:
      return {
        ...state,
        genres: state.genres.map(genre =>
          genre.id === action.payload.id ? action.payload : genre
        )
      };

    case ACTIONS.DELETE_GENRE:
      return {
        ...state,
        genres: state.genres.filter(genre => genre.id !== action.payload)
      };

    case ACTIONS.SET_SESSIONS:
      return { ...state, sessions: action.payload };

    case ACTIONS.ADD_SESSION:
      return { ...state, sessions: [...state.sessions, action.payload] };

    case ACTIONS.UPDATE_SESSION:
      return {
        ...state,
        sessions: state.sessions.map(session =>
          session.id === action.payload.id ? action.payload : session
        )
      };

    case ACTIONS.DELETE_SESSION:
      return {
        ...state,
        sessions: state.sessions.filter(session => session.id !== action.payload)
      };

    case ACTIONS.SET_SETTINGS:
      return { ...state, settings: action.payload };

    case ACTIONS.UPDATE_SETTINGS:
      return { ...state, settings: { ...state.settings, ...action.payload } };

    case ACTIONS.SET_FILTER:
      return {
        ...state,
        filters: {
          ...state.filters,
          [action.entity]: {
            ...state.filters[action.entity],
            ...action.payload
          }
        }
      };

    case ACTIONS.CLEAR_FILTERS:
      return {
        ...state,
        filters: initialState.filters
      };

    case ACTIONS.SET_SORT:
      return {
        ...state,
        sorting: {
          ...state.sorting,
          [action.entity]: {
            column: action.payload.column,
            direction: action.payload.direction
          }
        }
      };

    case ACTIONS.CLEAR_SORT:
      return {
        ...state,
        sorting: {
          ...state.sorting,
          [action.entity]: {
            column: null,
            direction: null
          }
        }
      };

    case ACTIONS.SET_SORTING_LOADING:
      return {
        ...state,
        sortingLoading: {
          ...state.sortingLoading,
          [action.entity]: action.payload
        }
      };

    default:
      return state;
  }
}

// Context
const AppContext = createContext();

// API base URL - will be set based on environment
const API_BASE_URL = '/api';

// API helper functions
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };

  const response = await fetch(url, { ...defaultOptions, ...options });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Provider component
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // API functions
  const api = {
    // Students
    async getStudents() {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      try {
        const result = await apiRequest('/students');
        dispatch({ type: ACTIONS.SET_STUDENTS, payload: result.data });
        return result.data;
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
        throw error;
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    },

    async createStudent(studentData) {
      try {
        const result = await apiRequest('/students', {
          method: 'POST',
          body: JSON.stringify(studentData)
        });
        dispatch({ type: ACTIONS.ADD_STUDENT, payload: result.data });
        return result.data;
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    async updateStudent(id, updates) {
      try {
        const result = await apiRequest(`/students/${id}`, {
          method: 'PUT',
          body: JSON.stringify(updates)
        });
        dispatch({ type: ACTIONS.UPDATE_STUDENT, payload: result.data });
        return result.data;
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    async deleteStudent(id) {
      try {
        await apiRequest(`/students/${id}`, { method: 'DELETE' });
        dispatch({ type: ACTIONS.DELETE_STUDENT, payload: id });
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    async bulkImportStudents(studentsData) {
      try {
        const result = await apiRequest('/students/bulk', {
          method: 'POST',
          body: JSON.stringify({ students: studentsData })
        });

        // Add all created students to state
        result.data.created.forEach(student => {
          dispatch({ type: ACTIONS.ADD_STUDENT, payload: student });
        });

        return result;
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    // Classes
    async getClasses() {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      try {
        const result = await apiRequest('/classes');
        dispatch({ type: ACTIONS.SET_CLASSES, payload: result.data });
        return result.data;
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
        throw error;
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    },

    async createClass(classData) {
      try {
        const result = await apiRequest('/classes', {
          method: 'POST',
          body: JSON.stringify(classData)
        });
        dispatch({ type: ACTIONS.ADD_CLASS, payload: result.data });
        return result.data;
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    async updateClass(id, updates) {
      try {
        const result = await apiRequest(`/classes/${id}`, {
          method: 'PUT',
          body: JSON.stringify(updates)
        });
        dispatch({ type: ACTIONS.UPDATE_CLASS, payload: result.data });
        return result.data;
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    async deleteClass(id) {
      try {
        await apiRequest(`/classes/${id}`, { method: 'DELETE' });
        dispatch({ type: ACTIONS.DELETE_CLASS, payload: id });
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    // Books
    async getBooks() {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      try {
        const result = await apiRequest('/books');
        dispatch({ type: ACTIONS.SET_BOOKS, payload: result.data });
        return result.data;
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
        throw error;
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    },

    async createBook(bookData) {
      try {
        const result = await apiRequest('/books', {
          method: 'POST',
          body: JSON.stringify(bookData)
        });
        dispatch({ type: ACTIONS.ADD_BOOK, payload: result.data });
        return result.data;
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    async updateBook(id, updates) {
      try {
        const result = await apiRequest(`/books/${id}`, {
          method: 'PUT',
          body: JSON.stringify(updates)
        });
        dispatch({ type: ACTIONS.UPDATE_BOOK, payload: result.data });
        return result.data;
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    async deleteBook(id) {
      try {
        await apiRequest(`/books/${id}`, { method: 'DELETE' });
        dispatch({ type: ACTIONS.DELETE_BOOK, payload: id });
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    // Genres
    async getGenres() {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      try {
        const result = await apiRequest('/genres');
        dispatch({ type: ACTIONS.SET_GENRES, payload: result.data });
        return result.data;
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
        throw error;
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    },

    async createGenre(genreData) {
      try {
        const result = await apiRequest('/genres', {
          method: 'POST',
          body: JSON.stringify(genreData)
        });
        dispatch({ type: ACTIONS.ADD_GENRE, payload: result.data });
        return result.data;
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    async updateGenre(id, updates) {
      try {
        const result = await apiRequest(`/genres/${id}`, {
          method: 'PUT',
          body: JSON.stringify(updates)
        });
        dispatch({ type: ACTIONS.UPDATE_GENRE, payload: result.data });
        return result.data;
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    async deleteGenre(id) {
      try {
        await apiRequest(`/genres/${id}`, { method: 'DELETE' });
        dispatch({ type: ACTIONS.DELETE_GENRE, payload: id });
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    // Sessions
    async getSessions() {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      try {
        const result = await apiRequest('/sessions');
        dispatch({ type: ACTIONS.SET_SESSIONS, payload: result.data });
        return result.data;
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
        throw error;
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    },

    async createSession(sessionData) {
      try {
        const result = await apiRequest('/sessions', {
          method: 'POST',
          body: JSON.stringify(sessionData)
        });
        dispatch({ type: ACTIONS.ADD_SESSION, payload: result.data });
        return result.data;
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    async updateSession(id, updates) {
      try {
        const result = await apiRequest(`/sessions/${id}`, {
          method: 'PUT',
          body: JSON.stringify(updates)
        });
        dispatch({ type: ACTIONS.UPDATE_SESSION, payload: result.data });
        return result.data;
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    async deleteSession(id) {
      try {
        await apiRequest(`/sessions/${id}`, { method: 'DELETE' });
        dispatch({ type: ACTIONS.DELETE_SESSION, payload: id });
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    async getSessionsByStudent(studentId) {
      try {
        const result = await apiRequest(`/sessions/student/${studentId}`);
        return result.data;
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    // Recommendations
    async getRecommendations(studentId, limit = 5) {
      try {
        const result = await apiRequest('/recommendations', {
          method: 'POST',
          body: JSON.stringify({ studentId, limit })
        });
        return result.data;
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    // Settings
    async getSettings() {
      try {
        const result = await apiRequest('/settings');
        dispatch({ type: ACTIONS.SET_SETTINGS, payload: result.data });
        return result.data;
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    async updateSettings(updates) {
      try {
        const result = await apiRequest('/settings', {
          method: 'PUT',
          body: JSON.stringify(updates)
        });
        dispatch({ type: ACTIONS.UPDATE_SETTINGS, payload: result.data });
        return result.data;
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    // Data management
    async exportData() {
      try {
        const result = await apiRequest('/data/export');
        return result.data;
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    async importData(data, options = {}) {
      try {
        const result = await apiRequest('/data/import', {
          method: 'POST',
          body: JSON.stringify({ data, options })
        });
        return result;
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    // Utility functions
    clearError() {
      dispatch({ type: ACTIONS.CLEAR_ERROR });
    },

    setFilter(entity, filter) {
      dispatch({ type: ACTIONS.SET_FILTER, entity, payload: filter });
    },

    setSelectedClassFilter(classId) {
      dispatch({ type: ACTIONS.SET_SELECTED_CLASS_FILTER, payload: classId });
    },

    clearFilters() {
      dispatch({ type: ACTIONS.CLEAR_FILTERS });
    },

    // Sorting functions
    setSort(entity, column, direction) {
      dispatch({
        type: ACTIONS.SET_SORT,
        entity,
        payload: { column, direction }
      });
    },

    clearSort(entity) {
      dispatch({
        type: ACTIONS.CLEAR_SORT,
        entity
      });
    },

    setSortingLoading(entity, isLoading) {
      dispatch({
        type: ACTIONS.SET_SORTING_LOADING,
        entity,
        payload: isLoading
      });
    },

    // Enhanced API functions with sorting support
    async getStudentsSorted(sortBy = null, sortOrder = null) {
      dispatch({ type: ACTIONS.SET_SORTING_LOADING, entity: 'students', payload: true });
      try {
        const params = new URLSearchParams();
        if (sortBy && sortOrder) {
          params.append('sortBy', sortBy);
          params.append('sortOrder', sortOrder);
        }
        
        const url = params.toString() ? `/students?${params.toString()}` : '/students';
        const result = await apiRequest(url);
        dispatch({ type: ACTIONS.SET_STUDENTS, payload: result.data });
        return result.data;
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
        throw error;
      } finally {
        dispatch({ type: ACTIONS.SET_SORTING_LOADING, entity: 'students', payload: false });
      }
    },

    async getSessionsSorted(sortBy = null, sortOrder = null) {
      dispatch({ type: ACTIONS.SET_SORTING_LOADING, entity: 'sessions', payload: true });
      try {
        const params = new URLSearchParams();
        if (sortBy && sortOrder) {
          params.append('sortBy', sortBy);
          params.append('sortOrder', sortOrder);
        }
        
        const url = params.toString() ? `/sessions?${params.toString()}` : '/sessions';
        const result = await apiRequest(url);
        dispatch({ type: ACTIONS.SET_SESSIONS, payload: result.data });
        return result.data;
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
        throw error;
      } finally {
        dispatch({ type: ACTIONS.SET_SORTING_LOADING, entity: 'sessions', payload: false });
      }
    },

    async getBooksSorted(sortBy = null, sortOrder = null) {
      dispatch({ type: ACTIONS.SET_SORTING_LOADING, entity: 'books', payload: true });
      try {
        const params = new URLSearchParams();
        if (sortBy && sortOrder) {
          params.append('sortBy', sortBy);
          params.append('sortOrder', sortOrder);
        }
        
        const url = params.toString() ? `/books?${params.toString()}` : '/books';
        const result = await apiRequest(url);
        dispatch({ type: ACTIONS.SET_BOOKS, payload: result.data });
        return result.data;
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
        throw error;
      } finally {
        dispatch({ type: ACTIONS.SET_SORTING_LOADING, entity: 'books', payload: false });
      }
    }
  };

  // Utility functions defined outside API object for context access
  const setSelectedClassFilter = (classId) => {
    dispatch({ type: ACTIONS.SET_SELECTED_CLASS_FILTER, payload: classId });
  };

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await Promise.all([
          api.getStudents(),
          api.getClasses(),
          api.getBooks(),
          api.getGenres(),
          api.getSessions(),
          api.getSettings()
        ]);
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };

    loadInitialData();
  }, []);

  // Context value - defined after all functions are available
  const contextValue = {
    state,
    setSelectedClassFilter,
    dispatch,
    api
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

// Hook to use the context
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}