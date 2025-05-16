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
  useTheme,
  Avatar,
  Container,
  Tooltip
} from '@mui/material';
import {
  Logout,
  Menu as MenuIcon,
  Home as HomeIcon,
  Assessment,
  AdminPanelSettings
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
    if (currentPath.includes('/admin-management')) return 2;
    return false; // No tab active if on another page
  };

  // Kiểm tra xem người dùng hiện tại có phải là superadmin không
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    if (showLogout) {
      try {
        const adminData = JSON.parse(localStorage.getItem('currentAdmin'));
        if (adminData) {
          setIsSuperAdmin(adminData.isSuperAdmin || adminData.name === 'Quân Hoàng');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    }
  }, [showLogout]);

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
    <AppBar position="fixed" elevation={3}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* Logo/Brand - could be replaced with an actual logo */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mr: 2
            }}
          >
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 700,
                fontSize: isMobile ? '1.2rem' : '1.4rem',
                letterSpacing: '0.5px',
                background: 'linear-gradient(90deg, #ffffff 0%, rgba(255,255,255,0.8) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0px 1px 2px rgba(0,0,0,0.1)'
              }}
            >
              {title}
            </Typography>
          </Box>

          {/* Desktop Navigation */}
          {showNavigation && !isMobile && (
            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
              <Tabs
                value={getTabValue()}
                textColor="inherit"
                indicatorColor="secondary"
                aria-label="navigation tabs"
                sx={{
                  '& .MuiTab-root': {
                    minWidth: 'auto',
                    px: 3,
                    py: 2,
                    fontWeight: 500,
                    fontSize: '0.95rem',
                    transition: 'all 0.2s',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  },
                  '& .Mui-selected': {
                    fontWeight: 600,
                  }
                }}
              >
                <Tab
                  label="Check-in"
                  onClick={() => navigate('/checkin')}
                  icon={<HomeIcon sx={{ mb: 0.5, fontSize: '1.2rem' }} />}
                  iconPosition="start"
                />
                <Tab
                  label="Đánh giá"
                  onClick={() => navigate('/evaluation')}
                  icon={<Assessment sx={{ mb: 0.5, fontSize: '1.2rem' }} />}
                  iconPosition="start"
                />
                {isSuperAdmin && (
                  <Tab
                    label="Quản lý"
                    onClick={() => navigate('/admin-management')}
                    icon={<AdminPanelSettings sx={{ mb: 0.5, fontSize: '1.2rem' }} />}
                    iconPosition="start"
                  />
                )}
              </Tabs>
            </Box>
          )}

          {/* Desktop User Greeting */}
          <Box sx={{ flexGrow: isMobile ? 1 : 0, display: 'flex', alignItems: 'center' }}>
            {adminName && !isMobile && (
              <Tooltip title={`Đăng nhập với tên ${adminName}`}>
                <Chip
                  avatar={
                    <Avatar
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    >
                      {adminName.charAt(0).toUpperCase()}
                    </Avatar>
                  }
                  label={`Xin chào, ${adminName}`}
                  variant="outlined"
                  sx={{
                    color: 'white',
                    borderColor: 'rgba(255,255,255,0.3)',
                    mr: 2,
                    py: 0.5,
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.15)',
                    }
                  }}
                />
              </Tooltip>
            )}

            {/* Desktop Logout Button */}
            {showLogout && !isMobile && (
              <Button
                color="inherit"
                variant="outlined"
                startIcon={<Logout />}
                onClick={handleLogout}
                sx={{
                  borderColor: 'rgba(255,255,255,0.3)',
                  '&:hover': {
                    borderColor: 'rgba(255,255,255,0.6)',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  }
                }}
              >
                Đăng xuất
              </Button>
            )}
          </Box>

          {/* Mobile Menu Button */}
          {isMobile && showNavigation && (
            <IconButton
              color="inherit"
              edge="end"
              onClick={handleMenuOpen}
              sx={{
                ml: 1,
                backgroundColor: 'rgba(255,255,255,0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.2)',
                }
              }}
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
            sx={{
              mt: 1,
              '& .MuiPaper-root': {
                borderRadius: 2,
                minWidth: 220,
                boxShadow: '0px 4px 20px rgba(0,0,0,0.15)',
              }
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            {/* User Info in Mobile Menu */}
            {adminName && (
              <Box sx={{
                px: 2,
                py: 1.5,
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'rgba(25, 118, 210, 0.05)',
              }}>
                <Avatar
                  sx={{
                    mr: 1.5,
                    bgcolor: 'primary.main',
                    width: 36,
                    height: 36
                  }}
                >
                  {adminName.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="body1" fontWeight="medium">
                    {adminName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Quản trị viên
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Navigation Items */}
            {showNavigation && <Divider sx={{ my: 1 }} />}

            {showNavigation && (
              <MenuItem
                onClick={() => handleNavigate('/checkin')}
                selected={currentPath.includes('/checkin')}
                sx={{
                  py: 1.5,
                  borderRadius: 1,
                  mx: 0.5,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(25, 118, 210, 0.1)',
                    '&:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 0.15)',
                    }
                  }
                }}
              >
                <HomeIcon sx={{ mr: 2, color: 'primary.main' }} />
                Check-in
              </MenuItem>
            )}

            {showNavigation && (
              <MenuItem
                onClick={() => handleNavigate('/evaluation')}
                selected={currentPath.includes('/evaluation')}
                sx={{
                  py: 1.5,
                  borderRadius: 1,
                  mx: 0.5,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(25, 118, 210, 0.1)',
                    '&:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 0.15)',
                    }
                  }
                }}
              >
                <Assessment sx={{ mr: 2, color: 'primary.main' }} />
                Đánh giá
              </MenuItem>
            )}

            {showNavigation && isSuperAdmin && (
              <MenuItem
                onClick={() => handleNavigate('/admin-management')}
                selected={currentPath.includes('/admin-management')}
                sx={{
                  py: 1.5,
                  borderRadius: 1,
                  mx: 0.5,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(25, 118, 210, 0.1)',
                    '&:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 0.15)',
                    }
                  }
                }}
              >
                <AdminPanelSettings sx={{ mr: 2, color: 'primary.main' }} />
                Quản lý
              </MenuItem>
            )}



            {/* Logout Item */}
            {showLogout && <Divider sx={{ my: 1 }} />}

            {showLogout && (
              <MenuItem
                onClick={handleLogout}
                sx={{
                  py: 1.5,
                  color: 'error.main',
                  borderRadius: 1,
                  mx: 0.5,
                  '&:hover': {
                    backgroundColor: 'rgba(244, 67, 54, 0.08)',
                  }
                }}
              >
                <Logout sx={{ mr: 2 }} />
                Đăng xuất
              </MenuItem>
            )}
          </Menu>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;