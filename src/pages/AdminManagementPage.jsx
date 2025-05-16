// src/pages/AdminManagementPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import PageContainer from '../components/PageContainer';
import {
  Typography, Box, Paper, Button, TextField, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel,
  Snackbar, Alert, CircularProgress, Tooltip, Chip, alpha, useTheme,
  Divider, Avatar
} from '@mui/material';
import {
  Add, Edit, Delete, PersonAdd, Check, Close, Refresh,
  PhotoCamera, DeleteForever, SupervisorAccount, Person
} from '@mui/icons-material';

const AdminManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [participantDialogOpen, setParticipantDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [currentUser, setCurrentUser] = useState(null);
  const [currentParticipant, setCurrentParticipant] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    role: 'admin',
    password: '',
    isSuperAdmin: false
  });
  const [participantFormData, setParticipantFormData] = useState({
    name: '',
    type: 'supporter'
  });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteType, setDeleteType] = useState('');
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const theme = useTheme();

  useEffect(() => {
    // Lấy thông tin admin hiện tại từ localStorage
    const adminData = localStorage.getItem('currentAdmin');
    if (adminData) {
      setCurrentAdmin(JSON.parse(adminData));
    }

    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch users
      const usersResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/users`);
      setUsers(usersResponse.data);

      // Fetch participants
      const participantsResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/participants`);
      setParticipants(participantsResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      showSnackbar('Không thể tải dữ liệu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenUserDialog = (user = null) => {
    if (user) {
      setCurrentUser(user);
      setFormData({
        name: user.name,
        role: user.role || 'admin',
        password: '',
        isSuperAdmin: user.isSuperAdmin || false
      });
    } else {
      setCurrentUser(null);
      setFormData({
        name: '',
        role: 'admin',
        password: '',
        isSuperAdmin: false
      });
    }
    setUserDialogOpen(true);
  };

  const handleCloseUserDialog = () => {
    setUserDialogOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'isSuperAdmin' ? checked : value
    });
  };

  const handleSubmitUser = async () => {
    try {
      if (currentUser) {
        // Update existing user
        const response = await axios.put(
          `${process.env.REACT_APP_API_URL}/api/users/${currentUser._id}`,
          formData
        );
        showSnackbar('Cập nhật người dùng thành công', 'success');
      } else {
        // Create new user
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/users`,
          formData
        );
        showSnackbar('Tạo người dùng mới thành công', 'success');
      }

      // Refresh data
      fetchData();
      handleCloseUserDialog();
    } catch (error) {
      console.error('Error saving user:', error);
      showSnackbar('Có lỗi xảy ra khi lưu người dùng', 'error');
    }
  };

  const handleOpenConfirmDialog = (item, type) => {
    setDeleteTarget(item);
    setDeleteType(type);
    setConfirmDialogOpen(true);
  };

  const handleCloseConfirmDialog = () => {
    setConfirmDialogOpen(false);
    setDeleteTarget(null);
    setDeleteType('');
  };

  const handleConfirmDelete = async () => {
    try {
      if (deleteType === 'user') {
        await axios.delete(`${process.env.REACT_APP_API_URL}/api/users/${deleteTarget._id}`);
        showSnackbar('Xóa người dùng thành công', 'success');
      } else if (deleteType === 'photo') {
        await axios.delete(`${process.env.REACT_APP_API_URL}/api/users/delete-photo/${deleteTarget._id}`);
        showSnackbar('Xóa ảnh thành công', 'success');
      } else if (deleteType === 'participant') {
        await axios.delete(`${process.env.REACT_APP_API_URL}/api/participants/${deleteTarget._id}`);
        showSnackbar('Xóa người tham gia thành công', 'success');
      }

      // Refresh data
      fetchData();
      handleCloseConfirmDialog();
    } catch (error) {
      console.error('Error deleting:', error);
      showSnackbar('Có lỗi xảy ra khi xóa', 'error');
    }
  };

  // Hàm xử lý reset check-in
  const handleResetCheckIn = async (participant) => {
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/api/participants/${participant._id}/reset-checkin`);
      showSnackbar('Reset check-in thành công', 'success');
      fetchData();
    } catch (error) {
      console.error('Error resetting check-in:', error);
      showSnackbar('Có lỗi xảy ra khi reset check-in', 'error');
    }
  };

  // Hàm mở dialog thêm/sửa participant
  const handleOpenParticipantDialog = (participant = null) => {
    if (participant) {
      setCurrentParticipant(participant);
      setParticipantFormData({
        name: participant.name,
        type: participant.type || 'supporter'
      });
    } else {
      setCurrentParticipant(null);
      setParticipantFormData({
        name: '',
        type: 'supporter'
      });
    }
    setParticipantDialogOpen(true);
  };

  // Hàm đóng dialog thêm/sửa participant
  const handleCloseParticipantDialog = () => {
    setParticipantDialogOpen(false);
  };

  // Hàm xử lý thay đổi input trong form participant
  const handleParticipantInputChange = (e) => {
    const { name, value } = e.target;
    setParticipantFormData({
      ...participantFormData,
      [name]: value
    });
  };

  // Hàm xử lý submit form participant
  const handleSubmitParticipant = async () => {
    try {
      if (currentParticipant) {
        // Update existing participant
        await axios.put(
          `${process.env.REACT_APP_API_URL}/api/participants/${currentParticipant._id}`,
          participantFormData
        );
        showSnackbar('Cập nhật người tham gia thành công', 'success');
      } else {
        // Create new participant
        await axios.post(
          `${process.env.REACT_APP_API_URL}/api/participants`,
          participantFormData
        );
        showSnackbar('Tạo người tham gia mới thành công', 'success');
      }

      // Refresh data
      fetchData();
      handleCloseParticipantDialog();
    } catch (error) {
      console.error('Error saving participant:', error);
      showSnackbar('Có lỗi xảy ra khi lưu người tham gia', 'error');
    }
  };

  // Kiểm tra xem người dùng hiện tại có phải là superadmin không
  const isSuperAdmin = currentAdmin?.isSuperAdmin || currentAdmin?.name === 'Quân Hoàng';

  if (!isSuperAdmin) {
    return (
      <>
        <Header title="CISV Meme System" />
        <PageContainer>
          <Box sx={{ textAlign: 'center', mt: 8 }}>
            <Typography variant="h4" color="error" gutterBottom>
              Không có quyền truy cập
            </Typography>
            <Typography variant="body1">
              Bạn không có quyền truy cập vào trang quản lý này.
            </Typography>
          </Box>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Header title="CISV Meme System" />
      <PageContainer>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            mb: 4,
            fontWeight: 600,
            position: 'relative',
            display: 'inline-block',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -8,
              left: 0,
              width: '40%',
              height: 4,
              borderRadius: 2,
              backgroundColor: 'primary.main',
            }
          }}
        >
          Quản lý hệ thống
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Phần quản lý người dùng */}
            <Paper
              elevation={3}
              sx={{
                p: { xs: 2, sm: 3 },
                mb: 4,
                borderRadius: 3,
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 8,
                  backgroundColor: 'primary.main'
                }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight={600}>
                  Quản lý người dùng
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<PersonAdd />}
                  onClick={() => handleOpenUserDialog()}
                  sx={{ borderRadius: 8 }}
                >
                  Thêm người dùng
                </Button>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Tên</TableCell>
                      <TableCell>Vai trò</TableCell>
                      <TableCell>Quyền hạn</TableCell>
                      <TableCell align="right">Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar
                              sx={{
                                width: 36,
                                height: 36,
                                mr: 1.5,
                                bgcolor: user.isSuperAdmin ? 'error.main' : 'primary.main',
                                fontSize: '0.9rem'
                              }}
                            >
                              {user.name.charAt(0)}
                            </Avatar>
                            {user.name}
                          </Box>
                        </TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>
                          {user.isSuperAdmin ? (
                            <Chip
                              icon={<SupervisorAccount />}
                              label="Super Admin"
                              color="error"
                              size="small"
                            />
                          ) : (
                            <Chip
                              icon={<Person />}
                              label="Admin"
                              color="primary"
                              size="small"
                            />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Chỉnh sửa">
                            <IconButton
                              color="primary"
                              onClick={() => handleOpenUserDialog(user)}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Xóa">
                            <IconButton
                              color="error"
                              onClick={() => handleOpenConfirmDialog(user, 'user')}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            {/* Phần quản lý người tham gia */}
            <Paper
              elevation={3}
              sx={{
                p: { xs: 2, sm: 3 },
                mb: 4,
                borderRadius: 3,
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 8,
                  backgroundColor: 'secondary.main'
                }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight={600}>
                  Quản lý người tham gia
                </Typography>
                <Box>
                  <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={fetchData}
                    sx={{ borderRadius: 8, mr: 1 }}
                  >
                    Làm mới
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<PersonAdd />}
                    onClick={() => handleOpenParticipantDialog()}
                    sx={{ borderRadius: 8 }}
                  >
                    Thêm người tham gia
                  </Button>
                </Box>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Tên</TableCell>
                      <TableCell>Loại</TableCell>
                      <TableCell>Trạng thái</TableCell>
                      <TableCell>Ảnh</TableCell>
                      <TableCell align="right">Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {participants.map((participant) => (
                      <TableRow key={participant._id}>
                        <TableCell>{participant.name}</TableCell>
                        <TableCell>
                          {participant.type === 'leader' ? 'Leader' : 'Supporter'}
                        </TableCell>
                        <TableCell>
                          {participant.checkInStatus ? (
                            <Chip
                              icon={<Check />}
                              label="Đã check-in"
                              color="success"
                              size="small"
                            />
                          ) : (
                            <Chip
                              icon={<Close />}
                              label="Chưa check-in"
                              color="default"
                              size="small"
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {participant.checkInPhoto ? (
                            <Box
                              component="img"
                              src={participant.checkInPhoto}
                              alt={participant.name}
                              sx={{
                                width: 50,
                                height: 50,
                                borderRadius: 1,
                                objectFit: 'cover'
                              }}
                            />
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Không có ảnh
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Chỉnh sửa">
                            <IconButton
                              color="primary"
                              onClick={() => handleOpenParticipantDialog(participant)}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>

                          {participant.checkInStatus && (
                            <Tooltip title="Reset check-in">
                              <IconButton
                                color="warning"
                                onClick={() => handleResetCheckIn(participant)}
                              >
                                <Refresh />
                              </IconButton>
                            </Tooltip>
                          )}

                          {participant.checkInPhoto && (
                            <Tooltip title="Xóa ảnh">
                              <IconButton
                                color="error"
                                onClick={() => handleOpenConfirmDialog(participant, 'photo')}
                              >
                                <DeleteForever />
                              </IconButton>
                            </Tooltip>
                          )}

                          <Tooltip title="Xóa người tham gia">
                            <IconButton
                              color="error"
                              onClick={() => handleOpenConfirmDialog(participant, 'participant')}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </>
        )}

        {/* Dialog thêm/sửa người dùng */}
        <Dialog
          open={userDialogOpen}
          onClose={handleCloseUserDialog}
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              maxWidth: 500,
              width: '100%'
            }
          }}
        >
          <DialogTitle>
            {currentUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <TextField
                fullWidth
                margin="normal"
                label="Tên"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Vai trò</InputLabel>
                <Select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  label="Vai trò"
                >
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="superadmin">Super Admin</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                margin="normal"
                label="Mật khẩu"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                helperText={currentUser ? "Để trống nếu không muốn thay đổi mật khẩu" : ""}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isSuperAdmin}
                    onChange={handleInputChange}
                    name="isSuperAdmin"
                  />
                }
                label="Quyền Super Admin"
                sx={{ mt: 1 }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCloseUserDialog}>Hủy</Button>
            <Button
              variant="contained"
              onClick={handleSubmitUser}
              disabled={!formData.name}
            >
              {currentUser ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog xác nhận xóa */}
        <Dialog
          open={confirmDialogOpen}
          onClose={handleCloseConfirmDialog}
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            }
          }}
        >
          <DialogTitle>
            {deleteType === 'user' ? 'Xác nhận xóa người dùng' : 'Xác nhận xóa ảnh'}
          </DialogTitle>
          <DialogContent>
            <Typography>
              {deleteType === 'user'
                ? `Bạn có chắc chắn muốn xóa người dùng "${deleteTarget?.name}" không?`
                : `Bạn có chắc chắn muốn xóa ảnh của "${deleteTarget?.name}" không?`}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseConfirmDialog}>Hủy</Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleConfirmDelete}
            >
              Xóa
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog thêm/sửa người tham gia */}
        <Dialog
          open={participantDialogOpen}
          onClose={handleCloseParticipantDialog}
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              maxWidth: 500,
              width: '100%'
            }
          }}
        >
          <DialogTitle>
            {currentParticipant ? 'Chỉnh sửa người tham gia' : 'Thêm người tham gia mới'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <TextField
                fullWidth
                margin="normal"
                label="Tên"
                name="name"
                value={participantFormData.name}
                onChange={handleParticipantInputChange}
                required
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Loại</InputLabel>
                <Select
                  name="type"
                  value={participantFormData.type}
                  onChange={handleParticipantInputChange}
                  label="Loại"
                >
                  <MenuItem value="supporter">Supporter</MenuItem>
                  <MenuItem value="leader">Leader</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCloseParticipantDialog}>Hủy</Button>
            <Button
              variant="contained"
              onClick={handleSubmitParticipant}
              disabled={!participantFormData.name}
              color="secondary"
            >
              {currentParticipant ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar thông báo */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={5000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbar.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </PageContainer>
    </>
  );
};

export default AdminManagementPage;
