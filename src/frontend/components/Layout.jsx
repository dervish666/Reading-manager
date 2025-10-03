/**
 * Layout Component
 * Main layout with sidebar navigation
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  Fab,
  FormControl,
  Select,
  MenuItem,
  InputLabel
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  School as SchoolIcon,
  MenuBook as MenuBookIcon,
  Book as BookIcon,
  Category as CategoryIcon,
  EmojiEvents as EmojiEventsIcon,
  Settings as SettingsIcon,
  ChevronLeft as ChevronLeftIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useApp } from '../contexts/AppContext';

const drawerWidth = 280;

const navigationItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Students', icon: <SchoolIcon />, path: '/students' },
  { text: 'Reading Sessions', icon: <MenuBookIcon />, path: '/sessions' },
  { text: 'Books', icon: <BookIcon />, path: '/books' },
  { text: 'Classes', icon: <EmojiEventsIcon />, path: '/classes' },
  { text: 'Genres', icon: <CategoryIcon />, path: '/genres' },
  { text: 'Recommendations', icon: <EmojiEventsIcon />, path: '/recommendations' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' }
];

function Layout({ children }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { state, setSelectedClassFilter } = useApp();

  // Ensure setSelectedClassFilter is available
  if (!setSelectedClassFilter) {
    console.error('setSelectedClassFilter is not available in context');
  }
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: [2],
          py: 2,
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
        }}
      >
        <Typography variant="h6" noWrap component="div" color="primary" fontWeight={600}>
          Reading Assistant
        </Typography>
        {isMobile && (
          <IconButton onClick={handleDrawerToggle} sx={{ ml: 1 }}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Toolbar>
      <Box sx={{ flexGrow: 1, overflow: 'auto', py: 1 }}>
        <List sx={{ px: 1 }}>
          {navigationItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: 2,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    color: theme.palette.primary.main,
                    '& .MuiListItemIcon-root': {
                      color: theme.palette.primary.main,
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(99, 102, 241, 0.15)',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(99, 102, 241, 0.05)',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: location.pathname === item.path ? 600 : 400
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

         {/* Class Filter */}
         <Box sx={{ px: 2, py: 2 }}>
           <FormControl fullWidth size="small">
             <InputLabel id="class-filter-label">Filter by Class</InputLabel>
             <Select
               labelId="class-filter-label"
               value={state.selectedClassFilter}
               onChange={(e) => setSelectedClassFilter && setSelectedClassFilter(e.target.value)}
               label="Filter by Class"
             >
               <MenuItem value="">
                 <em>All Classes</em>
               </MenuItem>
               {state.classes.map((cls) => (
                 <MenuItem key={cls.id} value={cls.id}>
                   {cls.name}
                 </MenuItem>
               ))}
             </Select>
           </FormControl>
         </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: '#ffffff',
          color: '#1e293b',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Toolbar sx={{ minHeight: '64px' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" fontWeight={600}>
            {navigationItems.find(item => item.path === location.pathname)?.text || 'Reading Assistant'}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{
          width: { md: drawerWidth },
          flexShrink: { md: 0 },
          '& .MuiDrawer-paper': {
            backgroundColor: '#ffffff',
            borderRight: '1px solid rgba(0, 0, 0, 0.05)',
          }
        }}
        aria-label="navigation"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
          backgroundColor: '#f8fafc',
          minHeight: '100vh'
        }}
      >
        {children}

        {/* Floating Action Button for Quick Actions */}
        <Fab
          color="primary"
          aria-label="add"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 56,
            height: 56,
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'scale(1.05)',
              boxShadow: '0 6px 16px rgba(99, 102, 241, 0.4)',
            },
          }}
          onClick={() => {
            // Navigate to appropriate "add" page based on current route
            const currentPath = location.pathname;
            if (currentPath === '/students') {
              navigate('/students?action=new');
            } else if (currentPath === '/sessions') {
              navigate('/sessions?action=new');
            } else if (currentPath === '/books') {
              navigate('/books?action=new');
            } else if (currentPath === '/classes') {
              navigate('/classes?action=new');
            } else if (currentPath === '/genres') {
              navigate('/genres?action=new');
            }
          }}
        >
          <AddIcon />
        </Fab>
      </Box>
    </Box>
  );
}

export default Layout;