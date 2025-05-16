// src/pages/CheckInPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Webcam from 'react-webcam';
import Header from '../components/Header';
import PageContainer from '../components/PageContainer';
import { compressImage, compressImageFile } from '../utils/imageUtils';
import {
  Typography, Button, Box, Card,
  CardContent, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Avatar, Tab, Tabs,
  Input, CircularProgress, Snackbar, Alert,
  TextField, InputAdornment, Tooltip, useTheme, useMediaQuery,
  Fade, Zoom, alpha, Paper, Chip, Divider, LinearProgress
} from '@mui/material';
import {
  PhotoCamera,
  FileUpload,
  Cameraswitch,
  Search,
  Person,
  EmojiPeople,
  Close,
  CheckCircleOutline,
  HourglassEmpty,
  CameraAlt,
  Image
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
  const [facingMode, setFacingMode] = useState("environment");
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

        // Nén ảnh trước khi upload
        console.log('Compressing webcam image...');
        const compressedImage = await compressImage(imageSrc, 800, 800, 0.8);

        // Upload ảnh đã nén từ camera (base64)
        const uploadResponse = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/upload-photo`,
          { photo: compressedImage }
        );
        photoUrl = uploadResponse.data.url;
      } else { // Upload tab
        if (!selectedFile) {
          showSnackbar('Vui lòng chọn file ảnh', 'warning');
          setLoading(false);
          return;
        }

        // Nén file ảnh trước khi upload
        console.log('Compressing uploaded image file...');
        const compressedFile = await compressImageFile(selectedFile, 800, 800, 0.8);

        // Create form data for file upload
        const formData = new FormData();
        formData.append('photo', compressedFile);

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

  // Add theme and responsive hooks
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <>
      <Header title="CISV Meme System" />
      <PageContainer>
        <Box sx={{ width: '100%' }}>
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
            Check-in Người Tham Gia
          </Typography>

          {/* Ô tìm kiếm */}
          <Box
            sx={{
              mb: 4,
              position: 'relative',
              maxWidth: 500,
              mx: 'auto'
            }}
          >
            <TextField
              fullWidth
              placeholder="Tìm kiếm theo tên..."
              value={searchQuery}
              onChange={handleSearchChange}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  backgroundColor: alpha(theme.palette.primary.main, 0.04),
                  transition: 'all 0.3s',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  },
                  '&.Mui-focused': {
                    backgroundColor: '#fff',
                    boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)'
                  }
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="primary" />
                  </InputAdornment>
                ),
              }}
            />
            {searchQuery && (
              <IconButton
                size="small"
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.2),
                  }
                }}
                onClick={() => setSearchQuery('')}
              >
                <Close fontSize="small" />
              </IconButton>
            )}
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(4, 1fr)'
              },
              gap: 3
            }}
          >
            {filteredParticipants.map((participant, index) => (
              <Fade
                in={true}
                key={participant._id}
                style={{
                  transitionDelay: `${index % 16 * 50}ms`,
                  transitionDuration: '0.4s'
                }}
              >
                <Card
                  elevation={3}
                  sx={{
                    borderRadius: 3,
                    overflow: 'hidden',
                    position: 'relative',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 20px rgba(0,0,0,0.1)'
                    },
                    backgroundColor: participant.type === 'leader'
                      ? 'rgba(229, 115, 115, 0.05)'
                      : 'rgba(25, 118, 210, 0.05)'
                  }}
                >
                  {/* Colored top bar */}
                  <Box
                    sx={{
                      height: 8,
                      backgroundColor: participant.type === 'leader' ? 'error.main' : 'primary.main',
                      width: '100%'
                    }}
                  />

                  <CardContent sx={{
                    p: 3,
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 2
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: participant.type === 'leader' ? 'error.light' : 'primary.light',
                            color: 'white',
                            mr: 1.5,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                          }}
                        >
                          {participant.type === 'leader' ? (
                            <EmojiPeople sx={{ fontSize: 24 }} />
                          ) : (
                            <Person sx={{ fontSize: 24 }} />
                          )}
                        </Box>
                        <Box>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 600,
                              color: 'text.primary',
                              lineHeight: 1.2
                            }}
                          >
                            {participant.name}
                          </Typography>
                          <Chip
                            label={participant.type === 'leader' ? 'Leader' : 'Supporter'}
                            size="small"
                            sx={{
                              backgroundColor: participant.type === 'leader' ? 'error.light' : 'primary.light',
                              color: 'white',
                              fontWeight: 500,
                              mt: 0.5,
                              height: 24
                            }}
                          />
                        </Box>
                      </Box>

                      {/* Status indicator */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          backgroundColor: participant.checkInStatus
                            ? 'success.main'
                            : 'text.disabled',
                          color: 'white',
                          borderRadius: 10,
                          px: 1,
                          py: 0.5,
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }}
                      >
                        {participant.checkInStatus ? (
                          <>
                            <CheckCircleOutline sx={{ fontSize: 16, mr: 0.5 }} />
                            Đã check-in
                          </>
                        ) : (
                          <>
                            <HourglassEmpty sx={{ fontSize: 16, mr: 0.5 }} />
                            Chưa check-in
                          </>
                        )}
                      </Box>
                    </Box>

                    <Divider sx={{ my: 1.5 }} />

                    <Box sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexGrow: 1,
                      py: 1.5
                    }}>
                      {participant.checkInStatus ? (
                        <>
                          <Box
                            sx={{
                              position: 'relative',
                              mb: 2,
                              borderRadius: '50%',
                              overflow: 'hidden',
                              width: 100,
                              height: 100,
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                              border: '3px solid white'
                            }}
                          >
                            <Avatar
                              src={participant.checkInPhoto}
                              alt={participant.name}
                              sx={{
                                width: '100%',
                                height: '100%'
                              }}
                            />
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: 'rgba(0,0,0,0.3)',
                                opacity: 0,
                                transition: 'opacity 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                '&:hover': {
                                  opacity: 1
                                }
                              }}
                              onClick={() => handleCameraClick(participant, true)}
                            >
                              <CameraAlt sx={{ color: 'white', fontSize: 28 }} />
                            </Box>
                          </Box>

                          {participant.checkedInBy && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                fontStyle: 'italic',
                                textAlign: 'center'
                              }}
                            >
                              Check-in bởi: {participant.checkedInBy.name}
                            </Typography>
                          )}

                          <Button
                            variant="outlined"
                            color={participant.type === 'leader' ? "error" : "primary"}
                            startIcon={<CameraAlt />}
                            size="small"
                            onClick={() => handleCameraClick(participant, true)}
                            sx={{
                              mt: 2,
                              borderRadius: 6,
                              px: 2
                            }}
                          >
                            Cập nhật ảnh
                          </Button>
                        </>
                      ) : (
                        <>
                          <Box
                            sx={{
                              width: 100,
                              height: 100,
                              borderRadius: '50%',
                              backgroundColor: alpha(theme.palette.primary.main, 0.1),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mb: 2,
                              border: '2px dashed',
                              borderColor: alpha(theme.palette.primary.main, 0.3)
                            }}
                          >
                            <Image sx={{
                              fontSize: 40,
                              color: alpha(theme.palette.primary.main, 0.5)
                            }} />
                          </Box>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 2, textAlign: 'center' }}
                          >
                            Người tham gia này chưa được check-in
                          </Typography>

                          <Button
                            variant="contained"
                            color={participant.type === 'leader' ? "error" : "primary"}
                            startIcon={<CameraAlt />}
                            onClick={() => handleCameraClick(participant, false)}
                            sx={{
                              borderRadius: 6,
                              px: 2,
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                            }}
                          >
                            Check-in ngay
                          </Button>
                        </>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Fade>
            ))}

            {/* Hiển thị thông báo khi không tìm thấy kết quả */}
            {filteredParticipants.length === 0 && (
              <Box sx={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                mt: 4,
                p: 4,
                backgroundColor: alpha(theme.palette.primary.main, 0.03),
                borderRadius: 3,
                border: '1px dashed',
                borderColor: alpha(theme.palette.primary.main, 0.2)
              }}>
                <Image sx={{
                  fontSize: 60,
                  color: alpha(theme.palette.primary.main, 0.3),
                  mb: 2
                }} />
                <Typography
                  variant="h6"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  Không tìm thấy kết quả
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Không tìm thấy người tham gia với từ khóa "{searchQuery}"
                </Typography>
              </Box>
            )}
          </Box>

          {/* Check-in Dialog */}
          <Dialog
            open={showDialog}
            onClose={handleCloseDialog}
            fullWidth
            maxWidth="sm"
            disableEscapeKeyDown={loading}
            PaperProps={{
              sx: {
                borderRadius: 3,
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
                overflow: 'hidden'
              }
            }}
            TransitionComponent={Zoom}
            transitionDuration={300}
          >
            <DialogTitle sx={{
              p: 2,
              backgroundColor: currentParticipant?.type === 'leader' ? 'error.main' : 'primary.main',
              color: 'white'
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                  {isRecheckin ? 'Cập nhật check-in: ' : 'Check-in: '}{currentParticipant?.name}
                </Typography>
                <IconButton onClick={handleCloseDialog} sx={{ color: 'white' }} disabled={loading}>
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>

            <DialogContent sx={{ p: 0 }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                centered
                sx={{
                  borderBottom: 1,
                  borderColor: 'divider',
                  backgroundColor: alpha(theme.palette.primary.main, 0.03)
                }}
                indicatorColor="primary"
                textColor="primary"
              >
                <Tab
                  label="Chụp ảnh"
                  icon={<CameraAlt sx={{ fontSize: 20 }} />}
                  iconPosition="start"
                  sx={{
                    py: 2,
                    textTransform: 'none',
                    fontWeight: 500
                  }}
                />
                <Tab
                  label="Upload ảnh"
                  icon={<FileUpload sx={{ fontSize: 20 }} />}
                  iconPosition="start"
                  sx={{
                    py: 2,
                    textTransform: 'none',
                    fontWeight: 500
                  }}
                />
              </Tabs>

              <Box sx={{ p: 3 }}>
                {tabValue === 0 ? (
                  // Camera tab
                  <Box sx={{
                    width: '100%',
                    position: 'relative',
                    borderRadius: 2,
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                    {/* Nút chuyển đổi camera ở phía trên */}
                    <IconButton
                      sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        zIndex: 10,
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.95)'
                        }
                      }}
                      onClick={toggleCamera}
                    >
                      <Cameraswitch />
                    </IconButton>

                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      width="100%"
                      videoConstraints={{ facingMode: facingMode }}
                      onUserMedia={() => setIsCaptureReady(true)}
                    />
                  </Box>
                ) : (
                  // Upload tab
                  <Box sx={{
                    width: '100%',
                    textAlign: 'center',
                    py: 2
                  }}>
                    <Input
                      accept="image/*"
                      id="upload-photo"
                      type="file"
                      onChange={handleFileChange}
                      sx={{ display: 'none' }}
                    />

                    {!selectedFile ? (
                      <Box sx={{
                        border: '2px dashed',
                        borderColor: alpha(theme.palette.primary.main, 0.3),
                        borderRadius: 3,
                        p: 5,
                        backgroundColor: alpha(theme.palette.primary.main, 0.03),
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Image sx={{
                          fontSize: 60,
                          color: alpha(theme.palette.primary.main, 0.4),
                          mb: 2
                        }} />
                        <Typography
                          variant="body1"
                          color="text.secondary"
                          sx={{ mb: 3 }}
                        >
                          Chọn hoặc kéo thả ảnh vào đây
                        </Typography>
                        <label htmlFor="upload-photo">
                          <Button
                            variant="contained"
                            component="span"
                            startIcon={<FileUpload />}
                            disabled={loading}
                            sx={{
                              borderRadius: 6,
                              px: 3,
                              py: 1
                            }}
                          >
                            Chọn ảnh
                          </Button>
                        </label>
                      </Box>
                    ) : (
                      <Box sx={{ mt: 2 }}>
                        <Box sx={{
                          mb: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 500,
                              color: 'primary.main'
                            }}
                          >
                            Đã chọn: {selectedFile.name}
                          </Typography>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setSelectedFile(null)}
                            sx={{ ml: 1 }}
                          >
                            <Close fontSize="small" />
                          </IconButton>
                        </Box>

                        <Box sx={{
                          borderRadius: 2,
                          overflow: 'hidden',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          mb: 2
                        }}>
                          <img
                            src={URL.createObjectURL(selectedFile)}
                            alt="Preview"
                            style={{
                              maxWidth: '100%',
                              maxHeight: '300px',
                              display: 'block'
                            }}
                          />
                        </Box>

                        <label htmlFor="upload-photo">
                          <Button
                            variant="outlined"
                            component="span"
                            startIcon={<FileUpload />}
                            disabled={loading}
                            size="small"
                          >
                            Chọn ảnh khác
                          </Button>
                        </label>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            </DialogContent>

            <DialogActions sx={{
              p: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
              backgroundColor: alpha(theme.palette.primary.main, 0.02)
            }}>
              <Button
                onClick={handleCloseDialog}
                color="inherit"
                disabled={loading}
                sx={{
                  borderRadius: 6,
                  px: 3
                }}
              >
                Hủy
              </Button>
              <Button
                onClick={handleCapture}
                color="primary"
                variant="contained"
                disabled={(tabValue === 0 && !isCaptureReady) || (tabValue === 1 && !selectedFile) || loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                sx={{
                  borderRadius: 6,
                  px: 3,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
              >
                {loading ? 'Đang xử lý...' : (tabValue === 0 ? 'Chụp ảnh' : 'Upload ảnh')}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Snackbar for notifications */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={5000}
            onClose={handleSnackbarClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            sx={{
              mb: 2,
              '& .MuiPaper-root': {
                borderRadius: 2,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
              }
            }}
            TransitionComponent={Fade}
          >
            <Alert
              onClose={handleSnackbarClose}
              severity={snackbar.severity}
              variant="filled"
              sx={{
                width: '100%',
                alignItems: 'center',
                '& .MuiAlert-icon': {
                  fontSize: '1.5rem'
                }
              }}
              iconMapping={{
                success: <CheckCircleOutline fontSize="inherit" />,
                error: <Close fontSize="inherit" />
              }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Box>
      </PageContainer>
    </>
  );
};

export default CheckInPage;