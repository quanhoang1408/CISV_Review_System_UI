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
  Chip
} from '@mui/material';
import { Logout, Person } from '@mui/icons-material';

const Header = ({ title, showLogout = true }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const [adminName, setAdminName] = useState('');
  
  // Only show nav tabs on main application pages (not admin selection)
  const showNavigation = !currentPath.includes('/admin-selection');
  
  // Set the active tab based on current path
  const getTabValue = () => {
    if (currentPath.includes('/checkin')) return 0;
    if (currentPath.includes('/evaluation')) return 1;
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
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
        
        {showNavigation && (
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
            </Tabs>
          </Box>
        )}
        
        {adminName && (
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
        
        {showLogout && (
          <Button 
            color="inherit"
            startIcon={<Logout />}
            onClick={handleLogout}
          >
            Đăng xuất
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;