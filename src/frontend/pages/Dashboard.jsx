/**
 * Dashboard Page
 * Main overview page showing reading statistics and recent activity
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  LinearProgress,
  Button
} from '@mui/material';
import {
  School as SchoolIcon,
  MenuBook as MenuBookIcon,
  TrendingUp as TrendingUpIcon,
  EmojiEvents as EmojiEventsIcon,
  Visibility as VisibilityIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useApp } from '../contexts/AppContext';

function Dashboard() {
  const navigate = useNavigate();
  const { state } = useApp();

  const { students, sessions, books, classes } = state;

  // Helper function to filter sessions by selected class
  const getFilteredSessions = (sessionsToFilter) => {
    if (!state.selectedClassFilter) return sessionsToFilter;
    return sessionsToFilter.filter(session => {
      const student = students.find(s => s.id === session.studentId);
      return student?.classId === state.selectedClassFilter;
    });
  };

  const filteredSessions = getFilteredSessions(sessions);

  // Calculate statistics
  const totalStudents = students.length;
  const totalSessions = filteredSessions.length;
  const totalBooks = books.length;
  const totalClasses = classes.length;

  // Recent sessions (last 5)
  const recentSessions = filteredSessions
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  // Students needing attention (haven't read in configured days)
  const settings = state.settings;
  const needsAttentionDays = settings?.readingStatusSettings?.needsAttentionDays || 14;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - needsAttentionDays);

  const studentsNeedingAttention = students.filter(student => {
    if (!student.lastReadDate) return true;
    return new Date(student.lastReadDate) < cutoffDate;
  });

  // Reading level distribution
  const readingLevelStats = students.reduce((acc, student) => {
    const level = student.readingLevel || 'Not Set';
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {});

  // Recent activity summary
  const today = new Date().toDateString();
  const todaysSessions = filteredSessions.filter(session =>
    new Date(session.date).toDateString() === today
  ).length;

  const StatCard = ({ title, value, icon, color = 'primary', subtitle }) => (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="subtitle2" fontWeight={500}>
              {title}
            </Typography>
            <Typography variant="h3" component="div" color={`${color}.main`} fontWeight={700}>
              {value}
            </Typography>
            {subtitle && (
              <Typography color="textSecondary" variant="body2" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar
            sx={{
              bgcolor: `${color}.main`,
              width: 64,
              height: 64,
              boxShadow: `0 4px 12px ${theme.palette[color].main}20`,
            }}
          >
            {icon}
          </Avatar>
        </Box>
      </CardContent>
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 4,
          backgroundColor: `${color}.main`,
          opacity: 0.8,
        }}
      />
    </Card>
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getEnvironmentColor = (environment) => {
    return environment === 'school' ? 'primary' : 'secondary';
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Students"
            value={totalStudents}
            icon={<SchoolIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Reading Sessions"
            value={totalSessions}
            icon={<MenuBookIcon />}
            color="success"
            subtitle={`${todaysSessions} today`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Books Available"
            value={totalBooks}
            icon={<EmojiEventsIcon />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Classes"
            value={totalClasses}
            icon={<PersonIcon />}
            color="info"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Students Needing Attention */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <Typography variant="h6" fontWeight={600}>
                  Students Needing Attention
                </Typography>
                <Chip
                  label={`${studentsNeedingAttention.length} students`}
                  color="warning"
                  variant="outlined"
                  size="small"
                />
              </Box>
              {studentsNeedingAttention.length > 0 ? (
                <List sx={{ p: 0 }}>
                  {studentsNeedingAttention.slice(0, 5).map((student) => (
                    <ListItem
                      key={student.id}
                      sx={{
                        px: 0,
                        borderRadius: 2,
                        mb: 1,
                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.02)' }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'warning.main', width: 40, height: 40 }}>
                          <SchoolIcon fontSize="small" />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={student.name}
                        primaryTypographyProps={{ fontWeight: 500 }}
                        secondary={
                          student.lastReadDate
                            ? `Last read: ${formatDate(student.lastReadDate)}`
                            : 'Never read'
                        }
                        secondaryTypographyProps={{ fontSize: '0.875rem' }}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => navigate(`/students/${student.id}`)}
                          sx={{ '&:hover': { color: 'warning.main' } }}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                  {studentsNeedingAttention.length > 5 && (
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary={`... and ${studentsNeedingAttention.length - 5} more`}
                        primaryTypographyProps={{ color: 'textSecondary', fontSize: '0.875rem' }}
                      />
                    </ListItem>
                  )}
                </List>
              ) : (
                <Box textAlign="center" py={3}>
                  <Typography color="textSecondary" variant="body1">
                    All students are up to date! 🎉
                  </Typography>
                </Box>
              )}
              <Box mt={3}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate('/students')}
                  sx={{ py: 1.5 }}
                >
                  View All Students
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Sessions */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <Typography variant="h6" fontWeight={600}>
                  Recent Reading Sessions
                </Typography>
                <Chip
                  label={`${recentSessions.length} recent`}
                  color="success"
                  variant="outlined"
                  size="small"
                />
              </Box>
              {recentSessions.length > 0 ? (
                <List sx={{ p: 0 }}>
                  {recentSessions.map((session) => (
                    <ListItem
                      key={session.id}
                      sx={{
                        px: 0,
                        borderRadius: 2,
                        mb: 1,
                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.02)' }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: getEnvironmentColor(session.environment), width: 40, height: 40 }}>
                          {session.environment === 'school' ? 'S' : 'H'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${session.bookTitle} by ${session.author}`}
                        primaryTypographyProps={{
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          noWrap: true
                        }}
                        secondary={
                          <Box>
                            <Typography variant="body2" component="span">
                              {students.find(s => s.id === session.studentId)?.name}
                            </Typography>
                            <br />
                            <Typography variant="caption" color="textSecondary">
                              {formatDate(session.date)} • {session.assessment}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Chip
                          label={session.environment}
                          size="small"
                          color={getEnvironmentColor(session.environment)}
                          variant="outlined"
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box textAlign="center" py={3}>
                  <Typography color="textSecondary" variant="body1">
                    No reading sessions recorded yet
                  </Typography>
                </Box>
              )}
              <Box mt={3}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate('/sessions')}
                  sx={{ py: 1.5 }}
                >
                  View All Sessions
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Reading Level Distribution */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Reading Level Distribution
              </Typography>
              {Object.keys(readingLevelStats).length > 0 ? (
                <Box>
                  {Object.entries(readingLevelStats).map(([level, count]) => (
                    <Box key={level} mb={2.5}>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2" fontWeight={500}>
                          {level}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {count} students
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(count / totalStudents) * 100}
                        sx={{
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: 'rgba(0, 0, 0, 0.05)',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 5,
                          }
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box textAlign="center" py={3}>
                  <Typography color="textSecondary" variant="body1">
                    No reading levels set yet
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<SchoolIcon />}
                    onClick={() => navigate('/students?action=new')}
                    sx={{ py: 1.5, height: '100%' }}
                  >
                    Add Student
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<MenuBookIcon />}
                    onClick={() => navigate('/sessions?action=new')}
                    sx={{ py: 1.5, height: '100%' }}
                  >
                    Log Session
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<EmojiEventsIcon />}
                    onClick={() => navigate('/books?action=new')}
                    sx={{ py: 1.5, height: '100%' }}
                  >
                    Add Book
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<TrendingUpIcon />}
                    onClick={() => navigate('/recommendations')}
                    sx={{ py: 1.5, height: '100%' }}
                  >
                    Get Recommendations
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;