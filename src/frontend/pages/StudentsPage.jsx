/**
 * Students Page
 * Manage student information and reading preferences
 */

import React, { useState, useEffect, useMemo } from 'react';
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
  School as SchoolIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useApp } from '../contexts/AppContext';
import SortableTableHeader from '../components/SortableTableHeader';
import { sortData, shouldUseServerSideSorting } from '../utils/sortingUtils';

function StudentsPage() {
  const navigate = useNavigate();
  const { state, api, setSelectedClassFilter } = useApp();
  const { students, classes, genres } = state;

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    classId: '',
    readingLevel: '',
    preferences: {
      favoriteGenreIds: [],
      likes: [],
      dislikes: [],
      readingFormats: []
    }
  });

  // Bulk import state
  const [bulkImportDialog, setBulkImportDialog] = useState(false);
  const [bulkImportText, setBulkImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [selectedClassForImport, setSelectedClassForImport] = useState('');

  // Handle sorting
  const handleSort = async (column, direction) => {
    const { sorting } = state;
    
    // Update sorting state
    api.setSort('students', column, direction);
    
    // Determine if we need server-side sorting
    const useServerSide = shouldUseServerSideSorting(students.length);
    
    if (useServerSide && direction) {
      // Use server-side sorting
      try {
        await api.getStudentsSorted(column, direction);
      } catch (error) {
        console.error('Error sorting students:', error);
      }
    }
    // If client-side sorting, the useMemo below will handle it
  };

  // Filter and sort students
  const processedStudents = useMemo(() => {
    const { sorting } = state;
    
    // First filter students
    let filtered = students.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClass = !state.selectedClassFilter || student.classId === state.selectedClassFilter;
      return matchesSearch && matchesClass;
    });
    
    // Then sort if needed (client-side)
    if (sorting.students.column && sorting.students.direction) {
      const useServerSide = shouldUseServerSideSorting(students.length);
      if (!useServerSide) {
        filtered = sortData(filtered, sorting.students.column, sorting.students.direction);
      }
    }
    
    return filtered;
  }, [students, searchTerm, state.selectedClassFilter, state.sorting.students]);

  const handleCreateStudent = () => {
    setEditingStudent(null);
    setFormData({
      name: '',
      classId: '',
      readingLevel: '',
      preferences: {
        favoriteGenreIds: [],
        likes: [],
        dislikes: [],
        readingFormats: []
      }
    });
    setDialogOpen(true);
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      classId: student.classId || '',
      readingLevel: student.readingLevel || '',
      preferences: { ...student.preferences }
    });
    setDialogOpen(true);
  };

  const handleDeleteStudent = async (studentId) => {
    if (window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      try {
        await api.deleteStudent(studentId);
        setSnackbar({ open: true, message: 'Student deleted successfully', severity: 'success' });
      } catch (error) {
        setSnackbar({ open: true, message: 'Failed to delete student', severity: 'error' });
      }
    }
  };

  const handleSaveStudent = async () => {
    try {
      if (editingStudent) {
        await api.updateStudent(editingStudent.id, formData);
        setSnackbar({ open: true, message: 'Student updated successfully', severity: 'success' });
      } else {
        await api.createStudent(formData);
        setSnackbar({ open: true, message: 'Student created successfully', severity: 'success' });
      }
      setDialogOpen(false);
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to save student', severity: 'error' });
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingStudent(null);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleBulkImportOpen = () => {
    setBulkImportDialog(true);
    setSelectedClassForImport('');
  };

  const handleBulkImportClose = () => {
    setBulkImportDialog(false);
    setBulkImportText('');
    setSelectedClassForImport('');
  };

  const handleBulkImport = async () => {
    if (!bulkImportText.trim()) {
      setSnackbar({ open: true, message: 'Please enter student data', severity: 'error' });
      return;
    }

    setIsImporting(true);
    try {
      let studentsData;

      // Try to parse as JSON first
      try {
        studentsData = JSON.parse(bulkImportText);
      } catch {
        // If JSON parsing fails, try to parse as CSV-like format
        studentsData = parseTextToStudents(bulkImportText);
      }

      if (!Array.isArray(studentsData) || studentsData.length === 0) {
        setSnackbar({ open: true, message: 'No valid student data found', severity: 'error' });
        return;
      }

      const result = await api.bulkImportStudents(studentsData);

      const successCount = result.data.created.length;
      const errorCount = result.data.errors.length;

      setSnackbar({
        open: true,
        message: `Successfully imported ${successCount} students${errorCount > 0 ? `, ${errorCount} errors` : ''}`,
        severity: errorCount > 0 ? 'warning' : 'success'
      });

      handleBulkImportClose();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to import students', severity: 'error' });
    } finally {
      setIsImporting(false);
    }
  };

  const parseTextToStudents = (text) => {
    const lines = text.trim().split('\n').filter(line => line.trim());
    const students = [];

    for (const line of lines) {
      const name = line.trim();
      if (name) {
        students.push({
          name: name,
          classId: selectedClassForImport || null,
          readingLevel: null,
          preferences: {
            favoriteGenreIds: [],
            likes: [],
            dislikes: [],
            readingFormats: []
          }
        });
      }
    }

    return students;
  };

  const getStudentClass = (classId) => {
    return classes.find(c => c.id === classId);
  };

  const getReadingLevelColor = (level) => {
    if (!level || level === 'Not Set') return 'default';
    // Simple color coding based on reading level
    if (level.toLowerCase().includes('beginner') || level.toLowerCase().includes('early')) return 'success';
    if (level.toLowerCase().includes('intermediate') || level.toLowerCase().includes('developing')) return 'warning';
    if (level.toLowerCase().includes('advanced') || level.toLowerCase().includes('fluent')) return 'primary';
    return 'default';
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Students
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleBulkImportOpen}
          >
            Bulk Import
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateStudent}
          >
            Add Student
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Students Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <SortableTableHeader
                column="name"
                currentSort={state.sorting.students}
                onSort={handleSort}
              >
                Name
              </SortableTableHeader>
              <SortableTableHeader
                column="classId"
                currentSort={state.sorting.students}
                onSort={handleSort}
              >
                Class
              </SortableTableHeader>
              <SortableTableHeader
                column="readingLevel"
                currentSort={state.sorting.students}
                onSort={handleSort}
              >
                Reading Level
              </SortableTableHeader>
              <SortableTableHeader
                column="lastReadDate"
                currentSort={state.sorting.students}
                onSort={handleSort}
              >
                Last Read
              </SortableTableHeader>
              <TableCell>Favorite Genres</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {state.sortingLoading.students ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Box display="flex" justifyContent="center" alignItems="center" flexDirection="column" gap={2}>
                    <CircularProgress size={40} />
                    <Typography variant="body2" color="textSecondary">
                      Sorting students...
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              processedStudents.map((student) => (
                <TableRow key={student.id}>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 32, height: 32 }}>
                      <SchoolIcon />
                    </Avatar>
                    <Typography variant="body1" fontWeight="medium">
                      {student.name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  {getStudentClass(student.classId) ? (
                    <Chip
                      label={getStudentClass(student.classId).name}
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  {student.readingLevel && (
                    <Chip
                      label={student.readingLevel}
                      size="small"
                      color={getReadingLevelColor(student.readingLevel)}
                      variant="outlined"
                    />
                  )}
                </TableCell>
                <TableCell>
                  {student.lastReadDate ? new Date(student.lastReadDate).toLocaleDateString() : 'Never'}
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={0.5} flexWrap="wrap">
                    {student.preferences.favoriteGenreIds.slice(0, 3).map((genreId) => {
                      const genre = genres.find(g => g.id === genreId);
                      return genre ? (
                        <Chip
                          key={genreId}
                          label={genre.name}
                          size="small"
                          variant="outlined"
                        />
                      ) : null;
                    })}
                    {student.preferences.favoriteGenreIds.length > 3 && (
                      <Chip
                        label={`+${student.preferences.favoriteGenreIds.length - 3} more`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                    {student.preferences.favoriteGenreIds.length === 0 && (
                      <Typography variant="body2" color="textSecondary">
                        None set
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    onClick={() => navigate(`/students/${student.id}`)}
                    sx={{ mr: 1 }}
                  >
                    View
                  </Button>
                  <IconButton
                    size="small"
                    onClick={() => handleEditStudent(student)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteStudent(student.id)}
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

      {processedStudents.length === 0 && (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <CardContent>
            <SchoolIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No students found
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {searchTerm || state.selectedClassFilter
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by adding your first student'
              }
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Student Form Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingStudent ? 'Edit Student' : 'Add New Student'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Student Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Class</InputLabel>
                <Select
                  value={formData.classId}
                  onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                  label="Class"
                >
                  <MenuItem value="">No Class</MenuItem>
                  {classes.map((cls) => (
                    <MenuItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Reading Level"
                value={formData.readingLevel}
                onChange={(e) => setFormData({ ...formData, readingLevel: e.target.value })}
                placeholder="e.g., Beginner, Intermediate, Advanced"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Favorite Genres</InputLabel>
                <Select
                  multiple
                  value={formData.preferences.favoriteGenreIds}
                  onChange={(e) => setFormData({
                    ...formData,
                    preferences: {
                      ...formData.preferences,
                      favoriteGenreIds: e.target.value
                    }
                  })}
                  label="Favorite Genres"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => {
                        const genre = genres.find(g => g.id === value);
                        return genre ? (
                          <Chip key={value} label={genre.name} size="small" />
                        ) : null;
                      })}
                    </Box>
                  )}
                >
                  {genres.map((genre) => (
                    <MenuItem key={genre.id} value={genre.id}>
                      {genre.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveStudent} variant="contained" disabled={!formData.name.trim()}>
            {editingStudent ? 'Update Student' : 'Add Student'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog open={bulkImportDialog} onClose={handleBulkImportClose} maxWidth="md" fullWidth>
        <DialogTitle>Bulk Import Students</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Import multiple students at once. You can paste a list of names (one per line) or JSON data.
          </Typography>
          
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Default Class (Optional)</InputLabel>
                <Select
                  value={selectedClassForImport}
                  onChange={(e) => setSelectedClassForImport(e.target.value)}
                  label="Default Class (Optional)"
                >
                  <MenuItem value="">No Default Class</MenuItem>
                  {classes.map((cls) => (
                    <MenuItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <TextField
            fullWidth
            multiline
            rows={10}
            label="Student Data"
            value={bulkImportText}
            onChange={(e) => setBulkImportText(e.target.value)}
            placeholder="Enter student names (one per line) or JSON data..."
            sx={{ mb: 2 }}
          />

          <Typography variant="body2" color="textSecondary">
            <strong>Simple Format:</strong> One name per line<br />
            John Doe<br />
            Jane Smith<br />
            <br />
            <strong>JSON Format:</strong><br />
            [{`"name": "John Doe", "classId": "class-id", "readingLevel": "Intermediate"`}]
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleBulkImportClose}>Cancel</Button>
          <Button 
            onClick={handleBulkImport} 
            variant="contained" 
            disabled={isImporting || !bulkImportText.trim()}
          >
            {isImporting ? 'Importing...' : 'Import Students'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default StudentsPage;
