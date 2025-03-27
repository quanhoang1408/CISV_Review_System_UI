// src/pages/CheckInPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Webcam from 'react-webcam';
import Header from '../components/Header';
import {
  Container, Typography, Button, Box, Grid, Card, 
  CardContent, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Avatar, Tab, Tabs,
  Input, CircularProgress, Snackbar, Alert
} from '@mui/material';
import { 
  PhotoCamera, 
  FileUpload, 
  Cameraswitch // Thêm icon để chuyển đổi camera
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
  // Thêm state để xác định camera đang sử dụng
  const [facingMode, setFacingMode] = useState("user"); // "user" là camera trước, "environment" là camera sau

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

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleCameraClick = (participant) => {
    setCurrentParticipant(participant);
    setShowDialog(true);
    setTabValue(0); // Default to camera tab
    setSelectedFile(null);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  // Thêm hàm để chuyển đổi giữa camera trước và sau
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
      
      // Update participant check-in status
      await axios.put(`${process.env.REACT_APP_API_URL}/api/participants/${currentParticipant._id}/checkin`, {
        checkInStatus: true,
        checkInTime: new Date(),
        checkInPhoto: photoUrl
      });
      
      // Update state with new check-in info
      setParticipants(participants.map(p => 
        p._id === currentParticipant._id 
          ? { ...p, checkInStatus: true, checkInPhoto: photoUrl } 
          : p
      ));
      
      showSnackbar(`Đã check-in thành công cho ${currentParticipant.name}`, 'success');
      setShowDialog(false);
      setCurrentParticipant(null);
      setSelectedFile(null);
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
  };

  return (
    <>
      <Header title="CISV Meme System" />
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h4" component="h1">
              Check-in người tham gia
            </Typography>
            <Button 
              component={Link} 
              to="/evaluation" 
              variant="contained" 
              color="success"
            >
              Đến trang đánh giá
            </Button>
          </Box>
          
          <Grid container spacing={3}>
            {participants.map((participant) => (
              <Grid item xs={12} sm={6} md={4} key={participant._id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6">{participant.name}</Typography>
                      {participant.checkInStatus ? (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body2" color="success.main" sx={{ mr: 1 }}>
                            Đã check-in
                          </Typography>
                          <Avatar 
                            src={participant.checkInPhoto} 
                            alt={participant.name}
                            sx={{ width: 40, height: 40 }}
                          />
                        </Box>
                      ) : (
                        <IconButton 
                          color="primary" 
                          onClick={() => handleCameraClick(participant)}
                        >
                          <PhotoCamera />
                        </IconButton>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
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
              Check-in: {currentParticipant?.name}
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