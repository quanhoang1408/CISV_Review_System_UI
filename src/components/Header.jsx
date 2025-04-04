// src/components/Header.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  Button, 
  Tab, 
  Tabs,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { 
  Logout, 
  Person, 
  Menu as MenuIcon,
  Home as HomeIcon,
  Assessment,
  EmojiPeople,
  Leaderboard
} from '@mui/icons-material';

const Header = ({ title, showLogout = true }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const [adminName, setAdminName] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  
  // Only show nav tabs on main application pages (not admin selection)
  const showNavigation = !currentPath.includes('/admin-selection');
  
  // Set the active tab based on current path
  const getTabValue = () => {
    if (currentPath.includes('/checkin')) return 0;
    if (currentPath.includes('/evaluation')) return 1;
    if (currentPath.includes('/supporters')) return 2;
    return false; // No tab active if on another page
  };
  
  // Load admin name from localStorage
  useEffect(() => {
    if (showLogout) {
      try {
        const adminData = JSON.parse(localStorage.getItem('currentAdmin'));
        if (adminData && adminData.name) {
          setAdminName(adminData.name);
        }
      } catch (error) {
        console.error('Error loading admin data:', error);
      }
    }
  }, [showLogout]);

  const handleLogout = () => {
    localStorage.removeItem('currentAdmin');
    navigate('/');
    handleMenuClose();
  };
  
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleNavigate = (path) => {
    navigate(path);
    handleMenuClose();
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1,
            fontSize: isMobile ? '1.1rem' : '1.25rem',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {title}
        </Typography>
        
        {/* Desktop Navigation */}
        {showNavigation && !isMobile && (
          <Box sx={{ mr: 2 }}>
            <Tabs 
              value={getTabValue()} 
              textColor="inherit"
              indicatorColor="secondary"
              aria-label="navigation tabs"
            >
              <Tab 
                label="Check-in" 
                onClick={() => navigate('/checkin')}
              />
              <Tab 
                label="Đánh giá" 
                onClick={() => navigate('/evaluation')}
              />
              <Tab 
                label="Xếp hạng Supporter" 
                onClick={() => navigate('/supporters')}
              />
            </Tabs>
          </Box>
        )}
        
        {/* Desktop User Greeting */}
        {adminName && !isMobile && (
          <Chip
            icon={<Person />}
            label={`Xin chào, ${adminName}`}
            variant="outlined"
            sx={{ 
              color: 'white', 
              borderColor: 'rgba(255,255,255,0.5)',
              mr: 2,
              '& .MuiChip-icon': {
                color: 'white'
              }
            }}
          />
        )}
        
        {/* Desktop Logout Button */}
        {showLogout && !isMobile && (
          <Button 
            color="inherit"
            startIcon={<Logout />}
            onClick={handleLogout}
          >
            Đăng xuất
          </Button>
        )}
        
        {/* Mobile Menu Button */}
        {isMobile && showNavigation && (
          <IconButton
            color="inherit"
            edge="end"
            onClick={handleMenuOpen}
            sx={{ ml: 1 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        
        {/* Mobile Menu */}
        <Menu
          id="mobile-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
          sx={{ mt: 1 }}
        >
          {/* User Info in Mobile Menu */}
          {adminName && (
            <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center' }}>
              <Person sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="body1" fontWeight="medium">
                {adminName}
              </Typography>
            </Box>
          )}
          
          {showNavigation && (
            <>
              <Divider />
              <MenuItem 
                onClick={() => handleNavigate('/checkin')}
                selected={currentPath.includes('/checkin')}
              >
                <HomeIcon sx={{ mr: 1 }} />
                Check-in
              </MenuItem>
              <MenuItem 
                onClick={() => handleNavigate('/evaluation')}
                selected={currentPath.includes('/evaluation')}
              >
                <Assessment sx={{ mr: 1 }} />
                Đánh giá
              </MenuItem>
              <MenuItem 
                onClick={() => handleNavigate('/supporters')}
                selected={currentPath.includes('/supporters')}
              >
                <Leaderboard sx={{ mr: 1 }} />
                Xếp hạng Supporter
              </MenuItem>
            </>
          )}
          
          {showLogout && (
            <>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <Logout sx={{ mr: 1 }} />
                Đăng xuất
              </MenuItem>
            </>
          )}
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;