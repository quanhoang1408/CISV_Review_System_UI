// src/components/Header.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AppBar, Toolbar, Typography, Button, Box, 
  IconButton, Menu, MenuItem, Avatar 
} from '@mui/material';
import { AccountCircle, ExitToApp } from '@mui/icons-material';

const Header = ({ title, showLogout = true }) => {
  const [adminName, setAdminName] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    const adminData = localStorage.getItem('currentAdmin');
    if (adminData) {
      const admin = JSON.parse(adminData);
      setAdminName(admin.name);
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }, []);
  
  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('currentAdmin');
    navigate('/');
  };
  
  return (
    <AppBar position="static" color="primary" elevation={0} sx={{ mb: 3 }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
        
        {isLoggedIn && showLogout && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body1" sx={{ mr: 2 }}>
              Xin chào, {adminName}
            </Typography>
            
            <IconButton
              size="large"
              aria-label="account menu"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <AccountCircle />
            </IconButton>
            
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={handleLogout}>
                <ExitToApp sx={{ mr: 1 }} />
                Đăng xuất
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;