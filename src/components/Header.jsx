import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Alert,
  CircularProgress,
  TextField
} from '@mui/material';
import {
  Logout,
  Menu as MenuIcon,
  Home as HomeIcon,
  Assessment,
  AdminPanelSettings,
  Search as SearchIcon
} from '@mui/icons-material';

const Header = ({ title, showLogout = true }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const [adminName, setAdminName] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [changePinDialogOpen, setChangePinDialogOpen] = useState(false);
  const [oldPinDigits, setOldPinDigits] = useState(['', '', '', '']);
  const [newPinDigits, setNewPinDigits] = useState(['', '', '', '']);
  const [pinError, setPinError] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const showNavigation = !currentPath.includes('/admin-selection');

  const getTabValue = () => {
    if (currentPath.includes('/checkin')) return 0;
    if (currentPath.includes('/evaluation')) return 1;
    if (currentPath.includes('/participant-search')) return isSuperAdmin ? 2 : false;
    if (currentPath.includes('/admin-management')) return isSuperAdmin ? 3 : false;
    return false;
  };

  useEffect(() => {
    if (!showLogout) {
      return;
    }

    try {
      const adminData = JSON.parse(localStorage.getItem('currentAdmin'));
      if (adminData) {
        setAdminName(adminData.name || '');
        setIsSuperAdmin(adminData.isSuperAdmin || adminData.name === 'Quân Hoàng');
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  }, [showLogout]);

  const handleLogout = () => {
    localStorage.removeItem('currentAdmin');
    navigate('/');
    handleMenuClose();
  };

  const handleOpenChangePinDialog = () => {
    setChangePinDialogOpen(true);
    handleMenuClose();
  };

  const handleCloseChangePinDialog = () => {
    setChangePinDialogOpen(false);
    setOldPinDigits(['', '', '', '']);
    setNewPinDigits(['', '', '', '']);
    setPinError('');
    setPinLoading(false);
  };

  const handlePinDigitChange = (digits, setDigits, index, value) => {
    if (value !== '' && !/^\d$/.test(value)) {
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);

    if (value !== '' && index < 3) {
      const nextInput = document.getElementById(`pin-digit-${setDigits === setOldPinDigits ? 'old' : 'new'}-${index + 1}`);
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  const handlePinKeyDown = (digits, index, e) => {
    if (e.key === 'Backspace' && index > 0 && digits[index] === '') {
      const prevInput = document.getElementById(`pin-digit-${digits === oldPinDigits ? 'old' : 'new'}-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
      }
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleChangePinSubmit = async () => {
    const currentAdmin = JSON.parse(localStorage.getItem('currentAdmin'));
    if (!currentAdmin) {
      setPinError('Không tìm thấy thông tin quản trị viên. Vui lòng đăng nhập lại.');
      return;
    }

    if (oldPinDigits.some(digit => digit === '') || newPinDigits.some(digit => digit === '')) {
      setPinError('Vui lòng nhập đủ 4 chữ số cho cả PIN cũ và PIN mới');
      return;
    }

    const oldPassword = oldPinDigits.join('');
    const newPassword = newPinDigits.join('');

    if (oldPassword === newPassword) {
      setPinError('Mã PIN mới phải khác mã PIN cũ');
      return;
    }

    try {
      setPinLoading(true);
      await axios.put(`${process.env.REACT_APP_API_URL}/api/users/${currentAdmin._id}/change-password`, {
        oldPassword,
        newPassword
      });
      showSnackbar('Đổi mã PIN thành công', 'success');
      handleCloseChangePinDialog();
    } catch (error) {
      const message = error?.response?.data?.message;
      setPinError(message || 'Đổi mã PIN thất bại. Vui lòng thử lại.');
      setPinLoading(false);
    }
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
                    label="Tìm kiếm"
                    onClick={() => navigate('/participant-search')}
                    icon={<SearchIcon sx={{ mb: 0.5, fontSize: '1.2rem' }} />}
                    iconPosition="start"
                  />
                )}
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

            {adminName && !isMobile && (
              <Button
                color="inherit"
                variant="outlined"
                onClick={handleOpenChangePinDialog}
                sx={{
                  borderColor: 'rgba(255,255,255,0.3)',
                  mr: 2,
                  '&:hover': {
                    borderColor: 'rgba(255,255,255,0.6)',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  }
                }}
              >
                Đổi PIN
              </Button>
            )}

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
            {adminName && (
              <Box
                sx={{
                  px: 2,
                  py: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'rgba(25, 118, 210, 0.05)',
                }}
              >
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
                onClick={() => handleNavigate('/participant-search')}
                selected={currentPath.includes('/participant-search')}
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
                <SearchIcon sx={{ mr: 2, color: 'primary.main' }} />
                Tìm kiếm
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

            {showNavigation && (
              <MenuItem
                onClick={handleOpenChangePinDialog}
                sx={{
                  py: 1.5,
                  borderRadius: 1,
                  mx: 0.5,
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.1)',
                  }
                }}
              >
                <AdminPanelSettings sx={{ mr: 2, color: 'primary.main' }} />
                Đổi PIN
              </MenuItem>
            )}

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

          <Dialog
            open={changePinDialogOpen}
            onClose={handleCloseChangePinDialog}
            PaperProps={{ sx: { borderRadius: 3 } }}
          >
            <DialogTitle>Đổi mã PIN</DialogTitle>
            <DialogContent>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Nhập mã PIN cũ và mã PIN mới gồm 4 chữ số.
              </Typography>
              {pinError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {pinError}
                </Alert>
              )}
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Mã PIN cũ
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3 }}>
                {[0, 1, 2, 3].map((index) => (
                  <TextField
                    key={`old-${index}`}
                    id={`pin-digit-old-${index}`}
                    inputProps={{
                      maxLength: 1,
                      style: { textAlign: 'center', fontSize: '1.4rem', padding: '12px 0' }
                    }}
                    variant="outlined"
                    value={oldPinDigits[index]}
                    onChange={(e) => handlePinDigitChange(oldPinDigits, setOldPinDigits, index, e.target.value)}
                    onKeyDown={(e) => handlePinKeyDown(oldPinDigits, index, e)}
                    type="tel"
                    sx={{ width: 60 }}
                  />
                ))}
              </Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Mã PIN mới
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 1 }}>
                {[0, 1, 2, 3].map((index) => (
                  <TextField
                    key={`new-${index}`}
                    id={`pin-digit-new-${index}`}
                    inputProps={{
                      maxLength: 1,
                      style: { textAlign: 'center', fontSize: '1.4rem', padding: '12px 0' }
                    }}
                    variant="outlined"
                    value={newPinDigits[index]}
                    onChange={(e) => handlePinDigitChange(newPinDigits, setNewPinDigits, index, e.target.value)}
                    onKeyDown={(e) => handlePinKeyDown(newPinDigits, index, e)}
                    type="tel"
                    sx={{ width: 60 }}
                  />
                ))}
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'space-between' }}>
              <Button onClick={handleCloseChangePinDialog} variant="outlined" sx={{ borderRadius: 8, px: 3 }}>
                Hủy
              </Button>
              <Button
                onClick={handleChangePinSubmit}
                variant="contained"
                disabled={pinLoading || oldPinDigits.some(digit => digit === '') || newPinDigits.some(digit => digit === '')}
                sx={{ borderRadius: 8, px: 3, position: 'relative' }}
              >
                {pinLoading ? <CircularProgress size={24} sx={{ color: 'white', position: 'absolute' }} /> : 'Lưu PIN'}
              </Button>
            </DialogActions>
          </Dialog>

          <Snackbar
            open={snackbar.open}
            autoHideDuration={3000}
            onClose={handleSnackbarClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;
