/**
 * Settings API Routes
 * Handles application settings management
 */

import { Hono } from 'hono';
import {
  getSettings,
  saveSettings
} from '../data/kvProvider.js';

const app = new Hono();

// GET /api/settings - Get application settings
app.get('/', async (c) => {
  try {
    const settings = await getSettings(c.env.READING_ASSISTANT_KV);

    if (!settings) {
      return c.json({
        error: {
          code: 'NOT_FOUND',
          message: 'Settings not found'
        }
      }, 404);
    }

    return c.json({ data: settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return c.json({
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch settings'
      }
    }, 500);
  }
});

// PUT /api/settings - Update application settings
app.put('/', async (c) => {
  try {
    const updates = await c.req.json();

    // Get current settings
    const currentSettings = await getSettings(c.env.READING_ASSISTANT_KV) || {
      readingStatusSettings: {
        recentlyReadDays: 7,
        needsAttentionDays: 14
      }
    };

    // Validate readingStatusSettings
    if (updates.readingStatusSettings) {
      const { readingStatusSettings } = updates;

      if (readingStatusSettings.recentlyReadDays !== undefined) {
        const days = parseInt(readingStatusSettings.recentlyReadDays);
        if (isNaN(days) || days < 1 || days > 365) {
          return c.json({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Recently read days must be a number between 1 and 365'
            }
          }, 400);
        }
        readingStatusSettings.recentlyReadDays = days;
      }

      if (readingStatusSettings.needsAttentionDays !== undefined) {
        const days = parseInt(readingStatusSettings.needsAttentionDays);
        if (isNaN(days) || days < 1 || days > 365) {
          return c.json({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Needs attention days must be a number between 1 and 365'
            }
          }, 400);
        }
        readingStatusSettings.needsAttentionDays = days;
      }

      // Ensure recentlyReadDays is less than needsAttentionDays
      if (readingStatusSettings.recentlyReadDays >= readingStatusSettings.needsAttentionDays) {
        return c.json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Recently read days must be less than needs attention days'
          }
        }, 400);
      }
    }

    const updatedSettings = {
      ...currentSettings,
      ...updates,
      readingStatusSettings: {
        ...currentSettings.readingStatusSettings,
        ...updates.readingStatusSettings
      }
    };

    const savedSettings = await saveSettings(c.env.READING_ASSISTANT_KV, updatedSettings);
    return c.json({
      data: savedSettings,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return c.json({
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to update settings'
      }
    }, 500);
  }
});

export default app;