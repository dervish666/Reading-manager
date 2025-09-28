/**
 * Recommendations Page
 * AI-powered book recommendations for students
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
  Rating
} from '@mui/material';
import {
  EmojiEvents as EmojiEventsIcon,
  Refresh as RefreshIcon,
  Book as BookIcon
} from '@mui/icons-material';
import { useApp } from '../contexts/AppContext';

function RecommendationsPage() {
  const { state, api } = useApp();
  const { students, recommendations } = state;

  const [selectedStudent, setSelectedStudent] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentRecommendations, setCurrentRecommendations] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleGenerateRecommendations = async () => {
    if (!selectedStudent) return;

    setLoading(true);
    try {
      const recs = await api.getRecommendations(selectedStudent, 5);
      setCurrentRecommendations(recs);
      setSnackbar({ open: true, message: 'Recommendations generated successfully', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to generate recommendations', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const selectedStudentData = students.find(s => s.id === selectedStudent);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Book Recommendations
      </Typography>

      {/* Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Select Student</InputLabel>
                <Select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  label="Select Student"
                  sx={{
                    fontSize: '1.4rem',
                    minHeight: 64,
                    height: 64,
                    '& .MuiSelect-select': {
                      padding: '20px 16px',
                      fontSize: '1.4rem',
                      minHeight: '24px'
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '1.2rem'
                    },
                    '& .MuiMenuItem-root': {
                      fontSize: '1.4rem',
                      minHeight: 56,
                      padding: '12px 16px'
                    },
                    '& .MuiSelect-icon': {
                      fontSize: '2rem'
                    }
                  }}
                >
                  <MenuItem value="">Choose a student...</MenuItem>
                  {students.map((student) => (
                    <MenuItem key={student.id} value={student.id}>
                      {student.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <Button
                variant="contained"
                fullWidth
                onClick={handleGenerateRecommendations}
                disabled={!selectedStudent || loading}
                startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
              >
                {loading ? 'Generating...' : 'Generate Recommendations'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Selected Student Info */}
      {selectedStudentData && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Selected Student: {selectedStudentData.name}
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              {selectedStudentData.readingLevel && (
                <Chip label={`Level: ${selectedStudentData.readingLevel}`} color="primary" variant="outlined" />
              )}
              <Chip label={`${selectedStudentData.readingSessions?.length || 0} sessions logged`} variant="outlined" />
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {currentRecommendations.length > 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom>
              Recommended Books
            </Typography>
          </Grid>
          {currentRecommendations.map((rec, index) => (
            <Grid item xs={12} key={index}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="flex-start">
                    <BookIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2, mt: 1 }} />
                    <Box flexGrow={1}>
                      <Typography variant="h6" gutterBottom>
                        {rec.book.title}
                      </Typography>
                      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                        by {rec.book.author}
                      </Typography>

                      {rec.book.genreIds && (
                        <Box mb={2}>
                          {rec.book.genreIds.map((genreId) => {
                            const genre = state.genres.find(g => g.id === genreId);
                            return genre ? (
                              <Chip
                                key={genreId}
                                label={genre.name}
                                size="small"
                                variant="outlined"
                                sx={{ mr: 0.5, mb: 0.5 }}
                              />
                            ) : null;
                          })}
                        </Box>
                      )}

                      <Box mb={2}>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          Recommendation Score:
                        </Typography>
                        <Rating value={Math.min(5, Math.max(1, Math.round(rec.score)))} readOnly size="small" />
                      </Box>

                      {rec.reasoning && rec.reasoning.length > 0 && (
                        <Box>
                          <Typography variant="body2" color="textSecondary" gutterBottom>
                            Why recommended:
                          </Typography>
                          <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                            {rec.reasoning.map((reason, i) => (
                              <li key={i}>
                                <Typography variant="body2" color="textSecondary">
                                  {reason}
                                </Typography>
                              </li>
                            ))}
                          </ul>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Empty State */}
      {selectedStudent && !loading && currentRecommendations.length === 0 && (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <CardContent>
            <EmojiEventsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No recommendations yet
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Click "Generate Recommendations" to get personalized book suggestions for {selectedStudentData?.name}
            </Typography>
          </CardContent>
        </Card>
      )}

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default RecommendationsPage;