/**
 * Settings Page
 * Application configuration and settings
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  Snackbar,
  Divider
} from '@mui/material';
import {
  Save as SaveIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useApp } from '../contexts/AppContext';

function SettingsPage() {
  const { state, api } = useApp();
  const { settings } = state;

  const [formData, setFormData] = useState({
    recentlyReadDays: 7,
    needsAttentionDays: 14
  });
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (settings?.readingStatusSettings) {
      setFormData({
        recentlyReadDays: settings.readingStatusSettings.recentlyReadDays,
        needsAttentionDays: settings.readingStatusSettings.needsAttentionDays
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateSettings({
        readingStatusSettings: formData
      });
      setSnackbar({ open: true, message: 'Settings saved successfully', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to save settings', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleInputChange = (field) => (event) => {
    const value = parseInt(event.target.value);
    setFormData(prev => ({
      ...prev,
      [field]: isNaN(value) ? 0 : value
    }));
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Grid container spacing={3}>
        {/* Reading Status Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Reading Status Configuration
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Configure how the system determines reading status and attention requirements.
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Recently Read (days)"
                    type="number"
                    value={formData.recentlyReadDays}
                    onChange={handleInputChange('recentlyReadDays')}
                    helperText="Students who have read within this many days are considered 'recently active'"
                    inputProps={{ min: 1, max: 365 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Needs Attention (days)"
                    type="number"
                    value={formData.needsAttentionDays}
                    onChange={handleInputChange('needsAttentionDays')}
                    helperText="Students who haven't read within this many days need attention"
                    inputProps={{ min: 1, max: 365 }}
                  />
                </Grid>
              </Grid>

              {formData.recentlyReadDays >= formData.needsAttentionDays && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Recently Read days should be less than Needs Attention days
                </Alert>
              )}

              <Box mt={3}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={saving || formData.recentlyReadDays >= formData.needsAttentionDays}
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                About Reading Assistant
              </Typography>
              <Typography variant="body2" paragraph>
                A comprehensive reading tracking system designed for primary school teachers and volunteers to monitor student reading progress and provide personalized book recommendations.
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Features:
              </Typography>
              <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                <li>
                  <Typography variant="body2">
                    Track reading sessions with detailed assessments
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Manage student profiles and reading preferences
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    AI-powered book recommendations
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Monitor reading progress and identify students needing attention
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Comprehensive book and genre management
                  </Typography>
                </li>
              </ul>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Data Storage:
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Built with Cloudflare Workers and KV storage for fast, reliable data access.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default SettingsPage;