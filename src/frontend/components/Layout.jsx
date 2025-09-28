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
    <Box>
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: [1],
        }}
      >
        <Typography variant="h6" noWrap component="div" color="primary">
          Reading Assistant
        </Typography>
        {isMobile && (
          <IconButton onClick={handleDrawerToggle}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Toolbar>
      <Divider />
      <List>
        {navigationItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.main,
                  color: 'white',
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                  },
                },
              }}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

       {/* Class Filter */}
       <Box sx={{ p: 2 }}>
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
       <Divider />
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            {navigationItems.find(item => item.path === location.pathname)?.text || 'Reading Assistant'}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
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
          mt: 8
        }}
      >
        {children}

        {/* Floating Action Button for Quick Actions */}
        <Fab
          color="primary"
          aria-label="add"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
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