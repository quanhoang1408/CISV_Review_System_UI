// src/pages/AdminSelection.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import PageContainer from '../components/PageContainer';
import {
  Box, Typography, FormControl,
  InputLabel, Select, MenuItem, Button, Paper,
  useTheme, alpha, Avatar, Card, CardContent,
  Fade, CircularProgress, TextField, Dialog,
  DialogTitle, DialogContent, DialogActions, Alert
} from '@mui/material';
import { Person, ArrowForward, AccountCircle, Lock } from '@mui/icons-material';

const AdminSelection = () => {
  const [admins, setAdmins] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState('');
  const [passwordDigits, setPasswordDigits] = useState(['', '', '', '']);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    // Check if admin is already selected, redirect to checkin if so
    const admin = localStorage.getItem('currentAdmin');
    if (admin) {
      navigate('/checkin');
      return;
    }

    const fetchAdmins = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/users`);
        setAdmins(response.data);
      } catch (error) {
        console.error('Error fetching admins:', error);
      }
    };

    fetchAdmins();
  }, [navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedAdmin) {
      const admin = admins.find(admin => admin._id === selectedAdmin);

      // Kiểm tra nếu là admin Quân Hoàng (superadmin)
      if (admin.name === 'Quân Hoàng' || admin.isSuperAdmin) {
        setShowPasswordDialog(true);
      } else {
        handleLogin(admin);
      }
    }
  };

  const handlePasswordSubmit = async () => {
    const admin = admins.find(admin => admin._id === selectedAdmin);

    // Kiểm tra xem đã nhập đủ 4 chữ số chưa
    if (passwordDigits.some(digit => digit === '')) {
      setPasswordError('Vui lòng nhập đủ 4 chữ số');
      return;
    }

    // Kết hợp 4 chữ số thành mật khẩu
    const password = passwordDigits.join('');

    console.log('Đang xác thực với mật khẩu:', password);

    try {
      setLoading(true);

      // Kiểm tra nếu là Quân Hoàng và mật khẩu là 1408
      if (admin.name === 'Quân Hoàng') {
        // Đối với Quân Hoàng, luôn kiểm tra mật khẩu cứng
        if (password === '1408') {
          console.log('Đăng nhập thành công với Quân Hoàng');

          // Tạo thông tin admin với quyền superadmin
          const adminData = {
            _id: admin._id,
            name: admin.name,
            role: 'superadmin',
            isSuperAdmin: true
          };

          // Lưu thông tin admin đã xác thực
          localStorage.setItem('currentAdmin', JSON.stringify(adminData));

          // Chuyển hướng đến trang chính
          setTimeout(() => {
            navigate('/checkin');
          }, 800);
        } else {
          // Mật khẩu không đúng
          console.error('Mật khẩu không đúng cho Quân Hoàng');
          setPasswordError('Mật khẩu không đúng. Vui lòng thử lại.');
          setLoading(false);
        }
        return;
      }

      // Nếu không phải Quân Hoàng, gọi API xác thực
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/users/auth`, {
        name: admin.name,
        password: password
      });

      // Lưu thông tin admin đã xác thực
      localStorage.setItem('currentAdmin', JSON.stringify(response.data));

      // Chuyển hướng đến trang chính
      setTimeout(() => {
        navigate('/checkin');
      }, 800);
    } catch (error) {
      console.error('Authentication error:', error);
      setPasswordError('Mật khẩu không đúng. Vui lòng thử lại.');
      setLoading(false);
    }
  };

  const handleDigitChange = (index, value) => {
    // Chỉ cho phép nhập số
    if (value !== '' && !/^\d+$/.test(value)) {
      return;
    }

    // Cập nhật giá trị của chữ số tại vị trí index
    const newPasswordDigits = [...passwordDigits];
    newPasswordDigits[index] = value;
    setPasswordDigits(newPasswordDigits);

    // Tự động focus vào ô tiếp theo nếu đã nhập giá trị
    if (value !== '' && index < 3) {
      const nextInput = document.getElementById(`password-digit-${index + 1}`);
      if (nextInput) {
        nextInput.focus();
      }
    }

    // Không tự động submit khi nhập đủ 4 chữ số nữa
    // Người dùng sẽ nhấn nút "Đăng nhập" để xác nhận
  };

  const handleKeyDown = (index, e) => {
    // Xử lý phím Backspace
    if (e.key === 'Backspace' && index > 0 && passwordDigits[index] === '') {
      const prevInput = document.getElementById(`password-digit-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
      }
    }
  };

  const handleLogin = (admin) => {
    setLoading(true);
    localStorage.setItem('currentAdmin', JSON.stringify(admin));

    // Thêm timeout nhỏ để hiển thị hiệu ứng loading
    setTimeout(() => {
      navigate('/checkin');
    }, 800);
  };

  const handleClosePasswordDialog = () => {
    setShowPasswordDialog(false);
    setPasswordDigits(['', '', '', '']);
    setPasswordError('');
    setLoading(false);
  };

  return (
    <>
      <Header title="CISV Meme System" showLogout={false} />
      <PageContainer maxWidth="sm">
        <Fade in={true} timeout={800}>
          <Box sx={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '70vh'
          }}>
            <Card
              elevation={4}
              sx={{
                width: '100%',
                maxWidth: 450,
                borderRadius: 4,
                overflow: 'hidden',
                position: 'relative',
                transition: 'transform 0.3s, box-shadow 0.3s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.15)'
                }
              }}
            >
              {/* Thanh màu ở đầu card */}
              <Box
                sx={{
                  height: 8,
                  width: '100%',
                  backgroundColor: 'primary.main',
                  background: 'linear-gradient(90deg, #1976d2 0%, #2196f3 100%)'
                }}
              />

              <CardContent sx={{ p: 0 }}>
                {/* Phần header */}
                <Box
                  sx={{
                    p: 4,
                    pb: 3,
                    textAlign: 'center',
                    backgroundColor: alpha(theme.palette.primary.main, 0.03)
                  }}
                >
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      backgroundColor: 'primary.main',
                      margin: '0 auto 16px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                    }}
                  >
                    <Person sx={{ fontSize: 40 }} />
                  </Avatar>
                  <Typography
                    variant="h4"
                    component="h1"
                    gutterBottom
                    sx={{
                      fontWeight: 600,
                      color: 'primary.dark'
                    }}
                  >
                    Bạn là ai?
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Vui lòng chọn tên của bạn để tiếp tục
                  </Typography>
                </Box>

                {/* Phần form */}
                <Box
                  component="form"
                  onSubmit={handleSubmit}
                  sx={{
                    p: 4,
                    pt: 3
                  }}
                >
                  <FormControl
                    fullWidth
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: alpha(theme.palette.primary.main, 0.02),
                        transition: 'all 0.3s',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.05),
                        },
                        '&.Mui-focused': {
                          backgroundColor: '#fff',
                          boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)'
                        }
                      }
                    }}
                  >
                    <InputLabel id="admin-select-label">Chọn tên của bạn</InputLabel>
                    <Select
                      labelId="admin-select-label"
                      value={selectedAdmin}
                      label="Chọn tên của bạn"
                      onChange={(e) => setSelectedAdmin(e.target.value)}
                      required
                      startAdornment={
                        selectedAdmin ? (
                          <AccountCircle sx={{ ml: 1, mr: 1, color: 'primary.main' }} />
                        ) : null
                      }
                    >
                      {admins.map(admin => (
                        <MenuItem
                          key={admin._id}
                          value={admin._id}
                          sx={{
                            py: 1.5,
                            '&.Mui-selected': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.1),
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.15),
                              }
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                mr: 1.5,
                                bgcolor: 'primary.main',
                                fontSize: '0.9rem'
                              }}
                            >
                              {admin.name.charAt(0)}
                            </Avatar>
                            {admin.name}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    sx={{
                      mt: 3,
                      py: 1.5,
                      borderRadius: 8,
                      fontWeight: 600,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      position: 'relative'
                    }}
                    disabled={!selectedAdmin || loading}
                    endIcon={loading ? null : <ArrowForward />}
                  >
                    {loading ? (
                      <CircularProgress
                        size={24}
                        sx={{
                          color: 'white',
                          position: 'absolute'
                        }}
                      />
                    ) : 'Tiếp tục'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Fade>

        {/* Dialog nhập mật khẩu cho superadmin */}
        <Dialog
          open={showPasswordDialog}
          onClose={handleClosePasswordDialog}
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              maxWidth: 400,
              width: '100%'
            }
          }}
        >
          <DialogTitle sx={{
            pb: 1,
            pt: 3,
            textAlign: 'center'
          }}>
            <Typography variant="h5" fontWeight={600} color="primary.dark">
              Xác thực quản trị viên
            </Typography>
          </DialogTitle>

          <DialogContent sx={{ px: 3, pt: 2 }}>
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mb: 2
            }}>
              <Avatar
                sx={{
                  width: 70,
                  height: 70,
                  backgroundColor: 'primary.main',
                  margin: '0 auto 16px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                }}
              >
                <Lock sx={{ fontSize: 36 }} />
              </Avatar>

              <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
                Vui lòng nhập mật khẩu để tiếp tục với quyền quản trị viên
              </Typography>

              {passwordError && (
                <Alert
                  severity="error"
                  sx={{
                    mb: 2,
                    width: '100%',
                    borderRadius: 2
                  }}
                >
                  {passwordError}
                </Alert>
              )}

              <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                Nhập mã PIN 4 chữ số
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 2,
                  width: '100%',
                  mb: 2
                }}
              >
                {[0, 1, 2, 3].map((index) => (
                  <TextField
                    key={index}
                    id={`password-digit-${index}`}
                    inputProps={{
                      maxLength: 1,
                      style: {
                        textAlign: 'center',
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        padding: '12px 0'
                      }
                    }}
                    variant="outlined"
                    value={passwordDigits[index]}
                    onChange={(e) => handleDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    autoFocus={index === 0}
                    type="tel"
                    sx={{
                      width: '60px',
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: alpha(theme.palette.primary.main, 0.02),
                        transition: 'all 0.3s',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.05),
                        },
                        '&.Mui-focused': {
                          backgroundColor: '#fff',
                          boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)'
                        }
                      }
                    }}
                  />
                ))}
              </Box>
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'space-between' }}>
            <Button
              onClick={handleClosePasswordDialog}
              variant="outlined"
              sx={{ borderRadius: 8, px: 3, minWidth: 120 }}
            >
              Hủy
            </Button>
            <Button
              onClick={handlePasswordSubmit}
              variant="contained"
              disabled={loading || passwordDigits.some(digit => digit === '')}
              sx={{
                borderRadius: 8,
                px: 3,
                minWidth: 120,
                position: 'relative'
              }}
            >
              {loading ? (
                <CircularProgress
                  size={24}
                  sx={{
                    color: 'white',
                    position: 'absolute'
                  }}
                />
              ) : 'Đăng nhập'}
            </Button>
          </DialogActions>
        </Dialog>
      </PageContainer>
    </>
  );
};

export default AdminSelection;