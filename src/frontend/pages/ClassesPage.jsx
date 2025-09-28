/**
 * Classes Page
 * Manage school classes
 */

import React, { useState } from 'react';
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
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Class as ClassIcon
} from '@mui/icons-material';
import { useApp } from '../contexts/AppContext';

function ClassesPage() {
  const { state, api } = useApp();
  const { classes } = state;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [formData, setFormData] = useState({
    name: '',
    teacherName: '',
    schoolYear: ''
  });

  const handleCreateClass = () => {
    setEditingClass(null);
    setFormData({
      name: '',
      teacherName: '',
      schoolYear: ''
    });
    setDialogOpen(true);
  };

  const handleEditClass = (cls) => {
    setEditingClass(cls);
    setFormData({
      name: cls.name,
      teacherName: cls.teacherName || '',
      schoolYear: cls.schoolYear || ''
    });
    setDialogOpen(true);
  };

  const handleDeleteClass = async (classId) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      try {
        await api.deleteClass(classId);
        setSnackbar({ open: true, message: 'Class deleted successfully', severity: 'success' });
      } catch (error) {
        setSnackbar({ open: true, message: 'Failed to delete class', severity: 'error' });
      }
    }
  };

  const handleSaveClass = async () => {
    try {
      if (editingClass) {
        await api.updateClass(editingClass.id, formData);
        setSnackbar({ open: true, message: 'Class updated successfully', severity: 'success' });
      } else {
        await api.createClass(formData);
        setSnackbar({ open: true, message: 'Class created successfully', severity: 'success' });
      }
      setDialogOpen(false);
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to save class', severity: 'error' });
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingClass(null);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Classes</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateClass}>
          Add Class
        </Button>
      </Box>

      <Grid container spacing={3}>
        {classes.map((cls) => (
          <Grid item xs={12} md={6} lg={4} key={cls.id}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <ClassIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                  <Box flexGrow={1}>
                    <Typography variant="h6">{cls.name}</Typography>
                    {cls.teacherName && (
                      <Typography variant="body2" color="textSecondary">
                        Teacher: {cls.teacherName}
                      </Typography>
                    )}
                    {cls.schoolYear && (
                      <Typography variant="body2" color="textSecondary">
                        Year: {cls.schoolYear}
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Box display="flex" justifyContent="flex-end">
                  <IconButton onClick={() => handleEditClass(cls)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => handleDeleteClass(cls.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {classes.length === 0 && (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <CardContent>
            <ClassIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No classes found
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Start by adding your first class
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Class Form Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingClass ? 'Edit Class' : 'Add New Class'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Class Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Teacher Name"
                value={formData.teacherName}
                onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="School Year"
                value={formData.schoolYear}
                onChange={(e) => setFormData({ ...formData, schoolYear: e.target.value })}
                placeholder="e.g., Year 1, Year 2, etc."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveClass} variant="contained" disabled={!formData.name.trim()}>
            {editingClass ? 'Update' : 'Add Class'}
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

export default ClassesPage;