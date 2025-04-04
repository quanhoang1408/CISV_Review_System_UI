// src/pages/CheckInPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Webcam from 'react-webcam';
import Header from '../components/Header';
import {
  Container, Typography, Button, Box, Grid, Card, 
  CardContent, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Avatar, Tab, Tabs,
  Input, CircularProgress, Snackbar, Alert,
  TextField, InputAdornment, Tooltip
} from '@mui/material';
import { 
  PhotoCamera, 
  FileUpload, 
  Cameraswitch,
  Search,
  Person,
  EmojiPeople
} from '@mui/icons-material';

const CheckInPage = () => {
  const [participants, setParticipants] = useState([]);
  const [currentParticipant, setCurrentParticipant] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [isCaptureReady, setIsCaptureReady] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const webcamRef = useRef(null);
  const [facingMode, setFacingMode] = useState("user");
  const [searchQuery, setSearchQuery] = useState('');
  const [isRecheckin, setIsRecheckin] = useState(false);

  useEffect(() => {
    // Admin check is now handled by AuthWrapper
    const fetchParticipants = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/participants`);
        setParticipants(response.data);
      } catch (error) {
        console.error('Error fetching participants:', error);
        showSnackbar('Không thể tải danh sách người tham gia', 'error');
      }
    };

    fetchParticipants();
  }, []);

  // Hàm xử lý thay đổi tìm kiếm
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  // Lọc danh sách người tham gia theo tìm kiếm
  const filteredParticipants = participants.filter(participant => 
    participant.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleCameraClick = (participant, isRecheckin = false) => {
    setCurrentParticipant(participant);
    setShowDialog(true);
    setTabValue(0); // Default to camera tab
    setSelectedFile(null);
    setIsRecheckin(isRecheckin);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const toggleCamera = () => {
    setFacingMode(prevMode => prevMode === "user" ? "environment" : "user");
  };

  const handleCapture = async () => {
    if (!currentParticipant) return;
    
    setLoading(true);
    try {
      let photoUrl;
      
      if (tabValue === 0) { // Camera tab
        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) {
          showSnackbar('Không thể chụp ảnh từ camera', 'error');
          setLoading(false);
          return;
        }
        
        // Upload image from camera (base64)
        const uploadResponse = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/upload-photo`, 
          { photo: imageSrc }
        );
        photoUrl = uploadResponse.data.url;
      } else { // Upload tab
        if (!selectedFile) {
          showSnackbar('Vui lòng chọn file ảnh', 'warning');
          setLoading(false);
          return;
        }
        
        // Create form data for file upload
        const formData = new FormData();
        formData.append('photo', selectedFile);
        
        // Important: Don't set Content-Type header manually, let browser set it with boundary
        const uploadResponse = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/upload-photo/file`, 
          formData
        );
        
        photoUrl = uploadResponse.data.url;
        
        if (!photoUrl) {
          console.error('Upload response missing URL:', uploadResponse.data);
          showSnackbar('Không nhận được URL ảnh từ server', 'error');
          setLoading(false);
          return;
        }
      }
      
      // Lấy thông tin admin hiện tại
      const currentAdmin = JSON.parse(localStorage.getItem('currentAdmin'));
      
      // Update participant check-in status
      const checkInResponse = await axios.put(`${process.env.REACT_APP_API_URL}/api/participants/${currentParticipant._id}/checkin`, {
        checkInStatus: true,
        checkInTime: new Date(),
        checkInPhoto: photoUrl,
        checkedInBy: currentAdmin._id // Thêm ID của admin đang thực hiện check-in
      });
      
      // Cập nhật state với thông tin check-in mới từ response
      setParticipants(participants.map(p => 
        p._id === currentParticipant._id 
          ? checkInResponse.data // Sử dụng dữ liệu đã populated từ server
          : p
      ));
      
      const actionMessage = isRecheckin ? 'cập nhật check-in' : 'check-in';
      showSnackbar(`Đã ${actionMessage} thành công cho ${currentParticipant.name}`, 'success');
      setShowDialog(false);
      setCurrentParticipant(null);
      setSelectedFile(null);
      setIsRecheckin(false);
    } catch (error) {
      console.error('Error during check-in:', error);
      let errorMessage = 'Có lỗi xảy ra khi check-in';
      
      if (error.response) {
        console.error('Server response:', error.response.data);
        errorMessage = error.response.data.message || errorMessage;
      }
      
      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    if (loading) return; // Prevent closing while uploading
    setShowDialog(false);
    setCurrentParticipant(null);
    setSelectedFile(null);
    setIsRecheckin(false);
  };

  return (
    <>
      <Header title="CISV Meme System" />
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" sx={{ mb: 4 }}>
            Check-in
          </Typography>
          
          {/* Thêm ô tìm kiếm */}
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Tìm kiếm theo tên..."
              value={searchQuery}
              onChange={handleSearchChange}
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          
          <Grid container spacing={3}>
            {filteredParticipants.map((participant) => (
              <Grid item xs={12} sm={6} md={4} key={participant._id}>
                <Card 
                  variant="outlined"
                  sx={{ 
                    borderLeft: 6, 
                    borderColor: participant.type === 'leader' ? 'error.main' : 'primary.main',
                    backgroundColor: participant.type === 'leader' ? 'rgba(255, 0, 0, 0.05)' : 'rgba(0, 0, 255, 0.05)'
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {participant.type === 'leader' ? (
                          <EmojiPeople color="error" sx={{ mr: 1 }} />
                        ) : (
                          <Person color="primary" sx={{ mr: 1 }} />
                        )}
                        <Box>
                          <Typography variant="h6">{participant.name}</Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              display: 'inline-block',
                              bgcolor: participant.type === 'leader' ? 'error.light' : 'primary.light',
                              color: 'white',
                              px: 1,
                              py: 0.2,
                              borderRadius: 1,
                              mt: 0.5
                            }}
                          >
                            {participant.type === 'leader' ? 'Leader' : 'Supporter'}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {participant.checkInStatus ? (
                          <>
                            <Typography variant="body2" color="success.main" sx={{ mb: 0.5 }}>
                              Đã check-in
                            </Typography>
                            {participant.checkedInBy && (
                              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                                bởi {participant.checkedInBy.name}
                              </Typography>
                            )}
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar 
                                src={participant.checkInPhoto} 
                                alt={participant.name}
                                sx={{ width: 40, height: 40, mr: 1 }}
                              />
                              <Tooltip title="Cập nhật ảnh check-in">
                                <IconButton 
                                  size="small"
                                  color={participant.type === 'leader' ? "error" : "primary"}
                                  onClick={() => handleCameraClick(participant, true)}
                                >
                                  <PhotoCamera />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </>
                        ) : (
                          <IconButton 
                            color={participant.type === 'leader' ? "error" : "primary"}
                            onClick={() => handleCameraClick(participant, false)}
                          >
                            <PhotoCamera />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            
            {/* Hiển thị thông báo khi không tìm thấy kết quả */}
            {filteredParticipants.length === 0 && (
              <Box sx={{ width: '100%', textAlign: 'center', mt: 4, p: 2 }}>
                <Typography variant="body1" color="text.secondary">
                  Không tìm thấy người tham gia với từ khóa "{searchQuery}"
                </Typography>
              </Box>
            )}
          </Grid>

          {/* Check-in Dialog */}
          <Dialog 
            open={showDialog} 
            onClose={handleCloseDialog}
            fullWidth
            maxWidth="sm"
            disableEscapeKeyDown={loading}
          >
            <DialogTitle>
              {isRecheckin ? 'Cập nhật check-in: ' : 'Check-in: '}{currentParticipant?.name}
            </DialogTitle>
            <DialogContent>
              <Tabs value={tabValue} onChange={handleTabChange} centered sx={{ mb: 2 }}>
                <Tab label="Chụp ảnh" />
                <Tab label="Upload ảnh" />
              </Tabs>
              
              {tabValue === 0 ? (
                // Camera tab
                <Box sx={{ width: '100%', position: 'relative' }}>
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    width="100%"
                    videoConstraints={{ facingMode: facingMode }}
                    onUserMedia={() => setIsCaptureReady(true)}
                  />
                  {/* Thêm nút chuyển đổi camera */}
                  <IconButton 
                    sx={{ 
                      position: 'absolute', 
                      bottom: 8, 
                      right: 8, 
                      backgroundColor: 'rgba(255, 255, 255, 0.7)',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.9)'
                      }
                    }}
                    onClick={toggleCamera}
                  >
                    <Cameraswitch />
                  </IconButton>
                </Box>
              ) : (
                // Upload tab
                <Box sx={{ width: '100%', textAlign: 'center' }}>
                  <Input
                    accept="image/*"
                    id="upload-photo"
                    type="file"
                    onChange={handleFileChange}
                    sx={{ display: 'none' }}
                  />
                  <label htmlFor="upload-photo">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<FileUpload />}
                      sx={{ mb: 2 }}
                      disabled={loading}
                    >
                      Chọn ảnh
                    </Button>
                  </label>
                  
                  {selectedFile && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        Đã chọn: {selectedFile.name}
                      </Typography>
                      <img
                        src={URL.createObjectURL(selectedFile)}
                        alt="Preview"
                        style={{ maxWidth: '100%', maxHeight: '300px' }}
                      />
                    </Box>
                  )}
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button 
                onClick={handleCloseDialog} 
                color="inherit"
                disabled={loading}
              >
                Hủy
              </Button>
              <Button 
                onClick={handleCapture} 
                color="primary" 
                variant="contained"
                disabled={(tabValue === 0 && !isCaptureReady) || (tabValue === 1 && !selectedFile) || loading}
                startIcon={loading ? <CircularProgress size={24} color="inherit" /> : null}
              >
                {loading ? 'Đang xử lý...' : (tabValue === 0 ? 'Chụp ảnh' : 'Upload ảnh')}
              </Button>
            </DialogActions>
          </Dialog>
          
          {/* Snackbar for notifications */}
          <Snackbar 
            open={snackbar.open} 
            autoHideDuration={6000} 
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
        </Box>
      </Container>
    </>
  );
};

export default CheckInPage;