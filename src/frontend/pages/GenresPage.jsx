/**
 * Genres Page
 * Manage book genres
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
  Snackbar,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import { useApp } from '../contexts/AppContext';

function GenresPage() {
  const { state, api } = useApp();
  const { genres } = state;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGenre, setEditingGenre] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const handleCreateGenre = () => {
    setEditingGenre(null);
    setFormData({
      name: '',
      description: ''
    });
    setDialogOpen(true);
  };

  const handleEditGenre = (genre) => {
    setEditingGenre(genre);
    setFormData({
      name: genre.name,
      description: genre.description || ''
    });
    setDialogOpen(true);
  };

  const handleDeleteGenre = async (genreId) => {
    if (window.confirm('Are you sure you want to delete this genre?')) {
      try {
        await api.deleteGenre(genreId);
        setSnackbar({ open: true, message: 'Genre deleted successfully', severity: 'success' });
      } catch (error) {
        setSnackbar({ open: true, message: 'Failed to delete genre', severity: 'error' });
      }
    }
  };

  const handleSaveGenre = async () => {
    try {
      if (editingGenre) {
        await api.updateGenre(editingGenre.id, formData);
        setSnackbar({ open: true, message: 'Genre updated successfully', severity: 'success' });
      } else {
        await api.createGenre(formData);
        setSnackbar({ open: true, message: 'Genre created successfully', severity: 'success' });
      }
      setDialogOpen(false);
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to save genre', severity: 'error' });
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingGenre(null);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Genres</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateGenre}>
          Add Genre
        </Button>
      </Box>

      <Grid container spacing={3}>
        {genres.map((genre) => (
          <Grid item xs={12} md={6} lg={4} key={genre.id}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <CategoryIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                  <Box flexGrow={1}>
                    <Typography variant="h6">{genre.name}</Typography>
                    {genre.description && (
                      <Typography variant="body2" color="textSecondary">
                        {genre.description}
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Chip
                    label={genre.isPredefined ? 'Predefined' : 'Custom'}
                    size="small"
                    color={genre.isPredefined ? 'primary' : 'default'}
                    variant="outlined"
                  />
                  <Box>
                    <IconButton
                      onClick={() => handleEditGenre(genre)}
                      disabled={genre.isPredefined}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteGenre(genre.id)}
                      disabled={genre.isPredefined}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {genres.length === 0 && (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <CardContent>
            <CategoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No genres found
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Start by adding your first genre
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Genre Form Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingGenre ? 'Edit Genre' : 'Add New Genre'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Genre Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description (optional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveGenre} variant="contained" disabled={!formData.name.trim()}>
            {editingGenre ? 'Update' : 'Add Genre'}
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

export default GenresPage;