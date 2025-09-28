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

// Create Material-UI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          transition: 'box-shadow 0.3s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          fontSize: '1.4rem',
          minHeight: '64px',
          minWidth: '200px',
          '& .MuiSelect-select': {
            padding: '20px 16px',
            fontSize: '1.4rem',
            minHeight: '24px'
          },
          '& .MuiInputLabel-root': {
            fontSize: '1.2rem'
          },
          '& .MuiSelect-icon': {
            fontSize: '2rem'
          }
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '1.4rem',
          minHeight: '56px',
          padding: '12px 16px'
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          fontSize: '1.5rem',
          width: '48px',
          height: '48px',
          '& .MuiSvgIcon-root': {
            fontSize: '1.8rem'
          }
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-root': {
            fontSize: '1.4rem',
            minHeight: '64px',
            minWidth: '400px'
          },
          '& .MuiInputLabel-root': {
            fontSize: '1.2rem'
          },
          '& .MuiAutocomplete-popupIndicator': {
            fontSize: '2rem'
          }
        },
        option: {
          fontSize: '1.4rem',
          minHeight: '48px',
          padding: '12px 16px'
        },
        listbox: {
          maxHeight: '300px'
        }
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