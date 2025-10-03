/**
 * Sessions Page
 * Manage and track reading sessions
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Avatar,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Fab,
  Alert,
  Snackbar,
  FormControlLabel,
  Switch,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MenuBook as MenuBookIcon,
  Search as SearchIcon,
  School as SchoolIcon,
  Home as HomeIcon,
  ThumbUp as ThumbUpIcon,
  ThumbsUpDown as ThumbsUpDownIcon,
  ThumbDown as ThumbDownIcon
} from '@mui/icons-material';
import { useApp } from '../contexts/AppContext';
import SortableTableHeader from '../components/SortableTableHeader';
import { sortData, shouldUseServerSideSorting } from '../utils/sortingUtils';

function SessionsPage() {
  const navigate = useNavigate();
  const { state, api } = useApp();
  const { sessions, students, books } = state;

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedEnvironment, setSelectedEnvironment] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    studentId: '',
    bookId: '',
    bookTitle: '',
    author: '',
    assessment: '',
    notes: '',
    environment: 'school',
    bookPreference: ''
  });

  // Handle sorting
  const handleSort = async (column, direction) => {
    const { sorting } = state;
    
    // Update sorting state
    api.setSort('sessions', column, direction);
    
    // Determine if we need server-side sorting
    const useServerSide = shouldUseServerSideSorting(sessions.length);
    
    if (useServerSide && direction) {
      // Use server-side sorting
      try {
        await api.getSessionsSorted(column, direction);
      } catch (error) {
        console.error('Error sorting sessions:', error);
      }
    }
    // If client-side sorting, the useMemo below will handle it
  };

  // Filter and sort sessions
  const processedSessions = useMemo(() => {
    const { sorting } = state;
    
    // First filter sessions
    let filtered = sessions.filter(session => {
      const matchesSearch = searchTerm === '' ||
        session.bookTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        students.find(s => s.id === session.studentId)?.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStudent = !selectedStudent || session.studentId === selectedStudent;
      const sessionStudent = students.find(s => s.id === session.studentId);
      const matchesClass = !state.selectedClassFilter || sessionStudent?.classId === state.selectedClassFilter;
      const matchesEnvironment = !selectedEnvironment || session.environment === selectedEnvironment;

      return matchesSearch && matchesStudent && matchesEnvironment && matchesClass;
    });
    
    // Then sort if needed (client-side)
    if (sorting.sessions.column && sorting.sessions.direction) {
      const useServerSide = shouldUseServerSideSorting(sessions.length);
      if (!useServerSide) {
        filtered = sortData(filtered, sorting.sessions.column, sorting.sessions.direction);
      }
    }
    
    return filtered;
  }, [sessions, searchTerm, selectedStudent, selectedEnvironment, state.selectedClassFilter, students, state.sorting.sessions]);

  const handleCreateSession = () => {
    setEditingSession(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      studentId: '',
      bookId: '',
      bookTitle: '',
      author: '',
      assessment: '',
      notes: '',
      environment: 'school',
      bookPreference: ''
    });
    setDialogOpen(true);
  };

  const handleEditSession = (session) => {
    setEditingSession(session);
    setFormData({
      date: session.date,
      studentId: session.studentId,
      bookId: session.bookId || '',
      bookTitle: session.bookTitle,
      author: session.author,
      assessment: session.assessment,
      notes: session.notes || '',
      environment: session.environment,
      bookPreference: session.bookPreference || ''
    });
    setDialogOpen(true);
  };

  const handleDeleteSession = async (sessionId) => {
    if (window.confirm('Are you sure you want to delete this reading session?')) {
      try {
        await api.deleteSession(sessionId);
        setSnackbar({ open: true, message: 'Session deleted successfully', severity: 'success' });
      } catch (error) {
        setSnackbar({ open: true, message: 'Failed to delete session', severity: 'error' });
      }
    }
  };

  const handleSaveSession = async () => {
    try {
      const sessionData = {
        date: formData.date,
        studentId: formData.studentId,
        assessment: formData.assessment,
        notes: formData.notes,
        environment: formData.environment,
        bookPreference: formData.bookPreference || null
      };

      // If we have book details, include them
      if (formData.bookId) {
        sessionData.bookId = formData.bookId;
        sessionData.bookTitle = formData.bookTitle;
        sessionData.author = formData.author;
      } else if (formData.bookTitle && formData.author) {
        // Create book details from form
        sessionData.bookTitle = formData.bookTitle;
        sessionData.author = formData.author;
      }

      if (editingSession) {
        await api.updateSession(editingSession.id, sessionData);
        setSnackbar({ open: true, message: 'Session updated successfully', severity: 'success' });
      } else {
        await api.createSession(sessionData);
        setSnackbar({ open: true, message: 'Session created successfully', severity: 'success' });
      }
      setDialogOpen(false);
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to save session', severity: 'error' });
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingSession(null);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getStudentName = (studentId) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.name : 'Unknown Student';
  };

  const getEnvironmentIcon = (environment) => {
    return environment === 'school' ? <SchoolIcon /> : <HomeIcon />;
  };

  const getEnvironmentColor = (environment) => {
    return environment === 'school' ? 'primary' : 'secondary';
  };

  const handleBookSelect = (event, book) => {
    if (book) {
      setFormData({
        ...formData,
        bookId: book.id,
        bookTitle: book.title,
        author: book.author
      });
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Reading Sessions
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateSession}
        >
          Log Session
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search sessions"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Filter by Student</InputLabel>
                <Select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  label="Filter by Student"
                >
                  <MenuItem value="">All Students</MenuItem>
                  {students.map((student) => (
                    <MenuItem key={student.id} value={student.id}>
                      {student.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Environment</InputLabel>
                <Select
                  value={selectedEnvironment}
                  onChange={(e) => setSelectedEnvironment(e.target.value)}
                  label="Environment"
                >
                  <MenuItem value="">All Environments</MenuItem>
                  <MenuItem value="school">School</MenuItem>
                  <MenuItem value="home">Home</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Sessions Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <SortableTableHeader
                column="bookTitle"
                currentSort={state.sorting.sessions}
                onSort={handleSort}
              >
                Book
              </SortableTableHeader>
              <SortableTableHeader
                column="studentId"
                currentSort={state.sorting.sessions}
                onSort={handleSort}
              >
                Student
              </SortableTableHeader>
              <SortableTableHeader
                column="date"
                currentSort={state.sorting.sessions}
                onSort={handleSort}
              >
                Date
              </SortableTableHeader>
              <SortableTableHeader
                column="environment"
                currentSort={state.sorting.sessions}
                onSort={handleSort}
              >
                Environment
              </SortableTableHeader>
              <SortableTableHeader
                column="assessment"
                currentSort={state.sorting.sessions}
                onSort={handleSort}
              >
                Assessment
              </SortableTableHeader>
              <SortableTableHeader
                column="bookPreference"
                currentSort={state.sorting.sessions}
                onSort={handleSort}
              >
                Rating
              </SortableTableHeader>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {state.sortingLoading.sessions ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Box display="flex" justifyContent="center" alignItems="center" flexDirection="column" gap={2}>
                    <CircularProgress size={40} />
                    <Typography variant="body2" color="textSecondary">
                      Sorting sessions...
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              processedSessions.map((session) => (
                <TableRow key={session.id}>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <Avatar sx={{ bgcolor: getEnvironmentColor(session.environment), mr: 2, width: 32, height: 32 }}>
                      {getEnvironmentIcon(session.environment)}
                    </Avatar>
                    <Box>
                      <Typography variant="body1" fontWeight="medium">
                        {session.bookTitle}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        by {session.author}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>{getStudentName(session.studentId)}</TableCell>
                <TableCell>{new Date(session.date).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Chip
                    label={session.environment}
                    color={getEnvironmentColor(session.environment)}
                    variant="outlined"
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {session.assessment}
                    {session.notes && (
                      <>
                        <br />
                        <Typography variant="caption" color="textSecondary">
                          {session.notes}
                        </Typography>
                      </>
                    )}
                  </Typography>
                </TableCell>
                <TableCell>
                  {session.bookPreference && (
                    <>
                      {session.bookPreference === 'liked' && (
                        <Chip
                          icon={<ThumbUpIcon />}
                          label="Liked"
                          color="success"
                          variant="outlined"
                          size="small"
                        />
                      )}
                      {session.bookPreference === 'meh' && (
                        <Chip
                          icon={<ThumbsUpDownIcon />}
                          label="Okay"
                          color="warning"
                          variant="outlined"
                          size="small"
                        />
                      )}
                      {session.bookPreference === 'disliked' && (
                        <Chip
                          icon={<ThumbDownIcon />}
                          label="Disliked"
                          color="error"
                          variant="outlined"
                          size="small"
                        />
                      )}
                    </>
                  )}
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleEditSession(session)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDeleteSession(session.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {processedSessions.length === 0 && (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <CardContent>
            <MenuBookIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No reading sessions found
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {state.selectedClassFilter || searchTerm || selectedStudent || selectedEnvironment
                ? 'Try adjusting your search or filter criteria'
                : 'Start tracking reading progress by logging your first session'
              }
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Session Form Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingSession ? 'Edit Reading Session' : 'Log Reading Session'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Student</InputLabel>
                <Select
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  label="Student"
                >
                  {students.map((student) => (
                    <MenuItem key={student.id} value={student.id}>
                      {student.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Autocomplete
                options={books}
                getOptionLabel={(book) => `${book.title} by ${book.author}`}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Book (optional)"
                    sx={{
                      '& .MuiInputBase-root': {
                        fontSize: '1.4rem',
                        minHeight: '64px',
                        minWidth: '400px'
                      },
                      '& .MuiInputLabel-root': {
                        fontSize: '1.2rem'
                      }
                    }}
                  />
                )}
                onChange={handleBookSelect}
                value={books.find(book => book.id === formData.bookId) || null}
                sx={{
                  '& .MuiAutocomplete-popupIndicator': {
                    fontSize: '2rem'
                  },
                  '& .MuiAutocomplete-option': {
                    fontSize: '1.4rem',
                    minHeight: '48px',
                    padding: '12px 16px'
                  }
                }}
                ListboxProps={{
                  sx: {
                    maxHeight: '300px',
                    '& .MuiAutocomplete-option': {
                      fontSize: '1.4rem',
                      minHeight: '48px'
                    }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Book Title"
                value={formData.bookTitle}
                onChange={(e) => setFormData({ ...formData, bookTitle: e.target.value })}
                placeholder="Enter book title if not in list"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Author"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                placeholder="Enter author name"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Assessment"
                value={formData.assessment}
                onChange={(e) => setFormData({ ...formData, assessment: e.target.value })}
                placeholder="Describe how the reading session went..."
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Notes (optional)"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional notes..."
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl component="fieldset">
                <Box display="flex" alignItems="center">
                  <Typography sx={{ mr: 2 }}>Environment:</Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.environment === 'home'}
                        onChange={(e) => setFormData({
                          ...formData,
                          environment: e.target.checked ? 'home' : 'school'
                        })}
                      />
                    }
                    label={formData.environment === 'home' ? 'Home' : 'School'}
                  />
                </Box>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                How did the child feel about this book? (Optional)
              </Typography>
              <Box display="flex" gap={2} justifyContent="center">
                <Button
                  variant={formData.bookPreference === 'liked' ? 'contained' : 'outlined'}
                  color="success"
                  startIcon={<ThumbUpIcon />}
                  onClick={() => setFormData({ ...formData, bookPreference: formData.bookPreference === 'liked' ? '' : 'liked' })}
                  sx={{ minWidth: 120 }}
                >
                  Liked
                </Button>
                <Button
                  variant={formData.bookPreference === 'meh' ? 'contained' : 'outlined'}
                  color="warning"
                  startIcon={<ThumbsUpDownIcon />}
                  onClick={() => setFormData({ ...formData, bookPreference: formData.bookPreference === 'meh' ? '' : 'meh' })}
                  sx={{ minWidth: 120 }}
                >
                  Okay
                </Button>
                <Button
                  variant={formData.bookPreference === 'disliked' ? 'contained' : 'outlined'}
                  color="error"
                  startIcon={<ThumbDownIcon />}
                  onClick={() => setFormData({ ...formData, bookPreference: formData.bookPreference === 'disliked' ? '' : 'disliked' })}
                  sx={{ minWidth: 120 }}
                >
                  Disliked
                </Button>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSaveSession}
            variant="contained"
            disabled={!formData.studentId || !formData.assessment}
          >
            {editingSession ? 'Update' : 'Log Session'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default SessionsPage;