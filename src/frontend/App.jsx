/**
 * Main App Component
 * Reading Assistant - Primary School Reading Tracker
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { AppProvider } from './contexts/AppContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import StudentsPage from './pages/StudentsPage';
import StudentDetailPage from './pages/StudentDetailPage';
import SessionsPage from './pages/SessionsPage';
import BooksPage from './pages/BooksPage';
import ClassesPage from './pages/ClassesPage';
import GenresPage from './pages/GenresPage';
import RecommendationsPage from './pages/RecommendationsPage';
import SettingsPage from './pages/SettingsPage';

// Debug logging
console.log('App.jsx loaded, defining routes...');

// Create Material-UI theme with modern design
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6366f1', // Modern indigo
      light: '#818cf8',
      dark: '#4f46e5',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ec4899', // Modern pink
      light: '#f472b6',
      dark: '#db2777',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8fafc', // Light gray background
      paper: '#ffffff',
    },
    text: {
      primary: '#1e293b', // Dark slate
      secondary: '#64748b', // Medium slate
    },
    success: {
      main: '#10b981', // Modern green
      light: '#34d399',
      dark: '#059669',
    },
    warning: {
      main: '#f59e0b', // Modern amber
      light: '#fbbf24',
      dark: '#d97706',
    },
    error: {
      main: '#ef4444', // Modern red
      light: '#f87171',
      dark: '#dc2626',
    },
    info: {
      main: '#3b82f6', // Modern blue
      light: '#60a5fa',
      dark: '#2563eb',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
      lineHeight: 1.4,
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.5,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.2s ease-in-out',
          borderRadius: 12,
          '&:hover': {
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.1)',
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 500,
          padding: '8px 16px',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
        },
        contained: {
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            transition: 'all 0.2s ease-in-out',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(99, 102, 241, 0.5)',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderWidth: '2px',
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          fontSize: '1rem',
          minHeight: '48px',
          minWidth: '200px',
          '& .MuiSelect-select': {
            padding: '12px 14px',
            fontSize: '1rem',
            minHeight: '24px'
          },
          '& .MuiInputLabel-root': {
            fontSize: '0.875rem'
          },
          '& .MuiSelect-icon': {
            fontSize: '1.25rem'
          }
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '1rem',
          minHeight: '48px',
          padding: '12px 16px',
          borderRadius: 6,
          margin: '2px 4px',
          '&:hover': {
            backgroundColor: 'rgba(99, 102, 241, 0.08)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(99, 102, 241, 0.12)',
            '&:hover': {
              backgroundColor: 'rgba(99, 102, 241, 0.16)',
            },
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: 'rgba(99, 102, 241, 0.08)',
            transform: 'scale(1.05)',
          },
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-root': {
            fontSize: '1rem',
            minHeight: '48px',
            minWidth: '300px'
          },
          '& .MuiInputLabel-root': {
            fontSize: '0.875rem'
          },
          '& .MuiAutocomplete-popupIndicator': {
            fontSize: '1.25rem'
          }
        },
        option: {
          fontSize: '1rem',
          minHeight: '48px',
          padding: '12px 16px',
          borderRadius: 6,
          margin: '2px 4px',
          '&:hover': {
            backgroundColor: 'rgba(99, 102, 241, 0.08)',
          },
        },
        listbox: {
          maxHeight: '300px',
          padding: '4px',
        }
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          fontWeight: 500,
          fontSize: '0.75rem',
          height: 28,
        },
        colorPrimary: {
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          color: '#6366f1',
        },
        colorSecondary: {
          backgroundColor: 'rgba(236, 72, 153, 0.1)',
          color: '#ec4899',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#1e293b',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: '#f8fafc',
          fontWeight: 600,
          fontSize: '0.875rem',
          color: '#64748b',
          borderBottom: '1px solid #e2e8f0',
        },
        body: {
          fontSize: '0.875rem',
          borderBottom: '1px solid #f1f5f9',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppProvider>
        <Router>
          <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/students/:id" element={<StudentDetailPage />} />
                <Route path="/students" element={<StudentsPage />} />
                <Route path="/sessions" element={<SessionsPage />} />
                <Route path="/books" element={
                  <>
                    {console.log('Rendering BooksPage route') || null}
                    <BooksPage />
                  </>
                } />
                <Route path="/classes" element={<ClassesPage />} />
                <Route path="/genres" element={<GenresPage />} />
                <Route path="/recommendations" element={<RecommendationsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </Layout>
          </Box>
        </Router>
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;