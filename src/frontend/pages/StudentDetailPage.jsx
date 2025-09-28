/**
 * Student Detail Page
 * Shows comprehensive information about a specific student
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Button,
  Divider,
  LinearProgress,
  Alert,
  IconButton
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  School as SchoolIcon,
  MenuBook as MenuBookIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Assessment as AssessmentIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { useApp } from '../contexts/AppContext';

function StudentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, api } = useApp();
  const [student, setStudent] = useState(null);
  const [studentSessions, setStudentSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  console.log('StudentDetailPage - Component rendered with ID:', id);

  useEffect(() => {
    console.log('StudentDetailPage - Looking for student with ID:', id);
    console.log('StudentDetailPage - Available students:', state.students.length);
    console.log('StudentDetailPage - Available sessions:', state.sessions.length);

    // Wait for students data to be available
    if (state.students.length === 0) {
      console.log('StudentDetailPage - No students loaded yet, waiting...');
      return;
    }

    // Find the student first
    const foundStudent = state.students.find(s => s.id === id);

    if (foundStudent) {
      console.log('StudentDetailPage - Found student:', foundStudent);
      setStudent(foundStudent);
      // Filter sessions for this student (if sessions exist)
      if (state.sessions.length > 0) {
        const sessions = state.sessions.filter(session => session.studentId === id);
        console.log('StudentDetailPage - Found sessions:', sessions.length);
        setStudentSessions(sessions.sort((a, b) => new Date(b.date) - new Date(a.date)));
      } else {
        console.log('StudentDetailPage - No sessions available yet');
        setStudentSessions([]);
      }
    } else {
      console.log('StudentDetailPage - Student not found with ID:', id);
      console.log('StudentDetailPage - Available student IDs:', state.students.map(s => s.id));
    }

    // Set loading to false once we've attempted to find the student
    setLoading(false);
  }, [id, state.students, state.sessions]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getReadingLevelColor = (level) => {
    const colors = {
      'Beginner': 'success',
      'Intermediate': 'warning',
      'Advanced': 'primary',
      'Not Set': 'default'
    };
    return colors[level] || 'default';
  };

  const getEnvironmentColor = (environment) => {
    return environment === 'school' ? 'primary' : 'secondary';
  };

  const calculateReadingStreak = () => {
    if (studentSessions.length === 0) return 0;

    // Simple streak calculation - count consecutive days with reading
    const sortedSessions = [...studentSessions].sort((a, b) => new Date(b.date) - new Date(a.date));
    let streak = 0;
    let currentDate = new Date();

    for (const session of sortedSessions) {
      const sessionDate = new Date(session.date);
      const diffTime = Math.abs(currentDate - sessionDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= streak + 1) {
        streak++;
        currentDate = sessionDate;
      } else {
        break;
      }
    }

    return streak;
  };

  if (loading) {
    return (
      <Box>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <IconButton onClick={() => navigate('/students')} color="primary">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">
            Student Details
          </Typography>
        </Box>
        <LinearProgress />
        <Typography variant="h6" align="center" sx={{ mt: 4 }}>
          Loading student details...
        </Typography>
        <Typography variant="body2" align="center" sx={{ mt: 2, color: 'text.secondary' }}>
          Student ID: {id}
        </Typography>
      </Box>
    );
  }

  if (!student) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          Student not found
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/students')}
          variant="outlined"
        >
          Back to Students
        </Button>
      </Box>
    );
  }

  const readingStreak = calculateReadingStreak();
  const totalBooksRead = new Set(studentSessions.map(s => s.bookId)).size;

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <IconButton onClick={() => navigate('/students')} color="primary">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4">
          Student Details
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Student Information Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    mb: 2,
                    bgcolor: 'primary.main'
                  }}
                >
                  <PersonIcon sx={{ fontSize: 40 }} />
                </Avatar>

                <Typography variant="h5" gutterBottom>
                  {student.name}
                </Typography>

                <Box display="flex" gap={1} mb={2} flexWrap="wrap" justifyContent="center">
                  <Chip
                    label={`Level: ${student.readingLevel || 'Not Set'}`}
                    color={getReadingLevelColor(student.readingLevel)}
                    variant="outlined"
                  />
                  <Chip
                    label={`Class: ${student.className || 'Not Assigned'}`}
                    variant="outlined"
                  />
                </Box>

                <Typography variant="body2" color="textSecondary" mb={2}>
                  {student.email || 'No email provided'}
                </Typography>

                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => navigate(`/students?action=edit&id=${student.id}`)}
                  fullWidth
                >
                  Edit Student
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Statistics Card */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Reading Statistics
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h3" color="primary.main">
                      {studentSessions.length}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Total Sessions
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h3" color="success.main">
                      {totalBooksRead}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Books Read
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h3" color="warning.main">
                      {readingStreak}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Day Streak
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h3" color="info.main">
                      {student.lastReadDate ? formatDate(student.lastReadDate) : 'Never'}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Last Read
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Sessions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <MenuBookIcon color="primary" />
                <Typography variant="h6">
                  Recent Reading Sessions
                </Typography>
                <Chip
                  label={`${studentSessions.length} sessions`}
                  color="primary"
                  size="small"
                />
              </Box>

              {studentSessions.length > 0 ? (
                <List>
                  {studentSessions.slice(0, 10).map((session, index) => (
                    <React.Fragment key={session.id}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: getEnvironmentColor(session.environment) }}>
                            {session.environment === 'school' ? 'S' : 'H'}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="subtitle1">
                                {session.bookTitle}
                              </Typography>
                              <Chip
                                label={session.assessment}
                                size="small"
                                color={
                                  session.assessment === 'Excellent' ? 'success' :
                                  session.assessment === 'Good' ? 'primary' :
                                  session.assessment === 'Needs Improvement' ? 'warning' : 'default'
                                }
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="textSecondary">
                                by {session.author}
                              </Typography>
                              <Box display="flex" alignItems="center" gap={1} mt={1}>
                                <CalendarIcon fontSize="small" color="action" />
                                <Typography variant="caption" color="textSecondary">
                                  {formatDate(session.date)} • {session.environment}
                                </Typography>
                              </Box>
                              {session.notes && (
                                <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                                  "{session.notes}"
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < studentSessions.slice(0, 10).length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                  {studentSessions.length > 10 && (
                    <ListItem>
                      <ListItemText
                        primary={`... and ${studentSessions.length - 10} more sessions`}
                        primaryTypographyProps={{ color: 'textSecondary' }}
                      />
                    </ListItem>
                  )}
                </List>
              ) : (
                <Box textAlign="center" py={4}>
                  <MenuBookIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography color="textSecondary">
                    No reading sessions recorded yet
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default StudentDetailPage;