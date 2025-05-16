// src/pages/EvaluationPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import EvaluationForm from '../components/EvaluationForm';
import Header from '../components/Header';
import PageContainer from '../components/PageContainer';
import { compressImage, compressImageFile } from '../utils/imageUtils';
import {
  Typography, Box, Card, CardContent,
  Button, Avatar, Paper, IconButton, Rating, Divider,
  CircularProgress, Snackbar, Alert, TextField, InputAdornment,
  Chip, Dialog, DialogContent, DialogTitle, useTheme,
  Fade, Zoom, alpha
} from '@mui/material';
import {
  ArrowBack, Add, Search, Person, EmojiPeople, Close,
  CheckCircleOutline, HourglassEmpty
} from '@mui/icons-material';

const EvaluationPage = () => {
  const [participants, setParticipants] = useState([]);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [searchQuery, setSearchQuery] = useState('');
  const [imageDialog, setImageDialog] = useState({ open: false, imageUrl: '', name: '' });
  // Sử dụng ref thay vì state để lưu vị trí cuộn và trạng thái trước đó
  const scrollPositionRef = useRef(0);
  const prevSelectedParticipantRef = useRef(null);

  useEffect(() => {
    // Admin check is now handled by AuthWrapper
    const fetchParticipants = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/participants`);
        console.log('Participants data:', response.data);
        setParticipants(response.data);
      } catch (error) {
        console.error('Error fetching participants:', error);
        showSnackbar('Không thể tải danh sách người tham gia', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchParticipants();
  }, []);

  // Khôi phục vị trí cuộn từ localStorage khi trang được tải
  useEffect(() => {
    if (!selectedParticipant) {
      const savedScrollPosition = localStorage.getItem('evaluationPageScrollPosition');
      if (savedScrollPosition) {
        const parsedPosition = parseInt(savedScrollPosition, 10);
        scrollPositionRef.current = parsedPosition;
        console.log('Loaded saved scroll position from localStorage:', parsedPosition);
      }
    }
  }, [selectedParticipant]);

  // Theo dõi thay đổi của selectedParticipant để xử lý cuộn trang
  useEffect(() => {
    // Nếu quay lại danh sách (selectedParticipant === null) và trước đó đã chọn một người
    if (selectedParticipant === null && prevSelectedParticipantRef.current !== null) {
      // Lấy vị trí cuộn từ ref
      const savedPosition = scrollPositionRef.current;

      // Đảm bảo DOM đã được cập nhật trước khi cuộn
      if (savedPosition > 0) {
        setTimeout(() => {
          window.scrollTo({
            top: savedPosition,
            behavior: 'instant'
          });
          console.log('Restored scroll position to:', savedPosition);
        }, 100);
      }
    } else if (selectedParticipant !== null && prevSelectedParticipantRef.current === null) {
      // Khi xem chi tiết người tham gia, cuộn lên đầu trang
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      console.log('Scrolled to top for participant details');
    }

    // Cập nhật ref cho lần render tiếp theo
    prevSelectedParticipantRef.current = selectedParticipant;
  }, [selectedParticipant]);

  // Sử dụng cách tiếp cận đơn giản hơn:
  // - Lưu vị trí cuộn vào ref khi nhấp vào người tham gia
  // - Khôi phục vị trí cuộn khi quay lại danh sách

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

  const handleParticipantClick = async (participant) => {
    console.log('Selected participant:', participant);

    // Lưu vị trí cuộn hiện tại trước khi chuyển trang
    const currentScrollPosition = window.scrollY;
    console.log('Saving scroll position:', currentScrollPosition);

    // Lưu vị trí cuộn vào ref và localStorage
    scrollPositionRef.current = currentScrollPosition;
    localStorage.setItem('evaluationPageScrollPosition', currentScrollPosition.toString());

    setSelectedParticipant(participant);
    setLoading(true);
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/evaluations/${participant._id}`);
      console.log('Evaluations data:', response.data);
      setEvaluations(response.data);
    } catch (error) {
      console.error('Error fetching evaluations:', error);
      showSnackbar('Không thể tải đánh giá', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvaluation = () => {
    setShowForm(true);
  };

  const handleFormSubmit = async (evaluationData) => {
    try {
      setLoading(true);
      const currentAdmin = JSON.parse(localStorage.getItem('currentAdmin'));

      const payload = {
        participantId: selectedParticipant._id,
        evaluatorId: currentAdmin._id,
        criteria: evaluationData
      };

      await axios.post(`${process.env.REACT_APP_API_URL}/api/evaluations`, payload);

      // Refresh evaluations
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/evaluations/${selectedParticipant._id}`);
      setEvaluations(response.data);

      showSnackbar('Đã lưu đánh giá thành công', 'success');
      setShowForm(false);
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      showSnackbar('Có lỗi xảy ra khi gửi đánh giá', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
  };

  // Image dialog handlers
  const handleImageClick = (participant) => {
    if (participant.checkInStatus && participant.checkInPhoto) {
      setImageDialog({
        open: true,
        imageUrl: participant.checkInPhoto,
        name: participant.name
      });
    }
  };

  const handleCloseImageDialog = () => {
    setImageDialog({ open: false, imageUrl: '', name: '' });
  };

  // Helper function to render avatar with error handling
  const renderAvatar = (participant, size = { width: 100, height: 100 }) => {
    console.log(`Rendering avatar for ${participant.name}, checkInStatus: ${participant.checkInStatus}, photo URL: ${participant.checkInPhoto}`);

    if (participant.checkInStatus && participant.checkInPhoto) {
      return (
        <Avatar
          src={participant.checkInPhoto}
          alt={participant.name}
          sx={{
            ...size,
            mx: 'auto',
            mb: 2,
            cursor: 'pointer',
            '&:hover': {
              boxShadow: 3,
              transform: 'scale(1.05)'
            }
          }}
          // We handle click in the parent component
          onError={(e) => {
            console.error(`Error loading image for ${participant.name}:`, e);
            // Replace with initial on error
            e.target.src = '';
            e.target.onerror = null;
          }}
        >
          {participant.name.charAt(0).toUpperCase()}
        </Avatar>
      );
    } else {
      return (
        <Avatar
          sx={{ ...size, mx: 'auto', mb: 2, bgcolor: 'grey.400' }}
        >
          {participant.name.charAt(0).toUpperCase()}
        </Avatar>
      );
    }
  };

  // Add theme hook
  const theme = useTheme();

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
            Đánh giá người tham gia
          </Typography>

          {loading && !selectedParticipant && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {!loading && showForm && selectedParticipant ? (
            <Fade in={true}>
              <Paper
                elevation={3}
                sx={{
                  p: { xs: 2, sm: 4 },
                  borderRadius: 3,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
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
                <EvaluationForm
                  participant={selectedParticipant}
                  onSubmit={handleFormSubmit}
                  onCancel={handleCancelForm}
                />
              </Paper>
            </Fade>
          ) : !loading && selectedParticipant ? (
            <Fade in={true}>
              <Box>
                <Paper
                  elevation={3}
                  sx={{
                    p: { xs: 2, sm: 4 },
                    mb: 4,
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
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
                      backgroundColor: selectedParticipant.type === 'leader' ? 'error.main' : 'primary.main'
                    }}
                  />

                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'center', sm: 'flex-start' },
                      mb: 4,
                      pt: 1
                    }}
                  >
                    <Box
                      sx={{
                        position: 'relative',
                        mr: { xs: 0, sm: 4 },
                        mb: { xs: 3, sm: 0 },
                        textAlign: { xs: 'center', sm: 'left' }
                      }}
                    >
                      <Box
                        onClick={() => {
                          if (selectedParticipant.checkInStatus && selectedParticipant.checkInPhoto) {
                            handleImageClick(selectedParticipant);
                          }
                        }}
                        sx={{
                          position: 'relative',
                          '&::after': selectedParticipant.checkInStatus && selectedParticipant.checkInPhoto ? {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            borderRadius: '50%',
                            backgroundColor: 'rgba(0,0,0,0.1)',
                            opacity: 0,
                            transition: 'opacity 0.2s',
                            zIndex: 1,
                            cursor: 'pointer'
                          } : {},
                          '&:hover::after': {
                            opacity: 1
                          }
                        }}
                      >
                        {renderAvatar(selectedParticipant, { width: 120, height: 120 })}
                      </Box>
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: -8,
                          right: -8,
                          backgroundColor: selectedParticipant.type === 'leader' ? 'error.main' : 'primary.main',
                          borderRadius: '50%',
                          width: 36,
                          height: 36,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                        }}
                      >
                        {selectedParticipant.type === 'leader' ?
                          <EmojiPeople sx={{ color: 'white', fontSize: 22 }} /> :
                          <Person sx={{ color: 'white', fontSize: 22 }} />
                        }
                      </Box>
                    </Box>

                    <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                      <Typography
                        variant="h4"
                        component="h2"
                        sx={{
                          fontWeight: 600,
                          mb: 1,
                          color: selectedParticipant.type === 'leader' ? 'error.dark' : 'primary.dark'
                        }}
                      >
                        {selectedParticipant.name}
                      </Typography>

                      <Chip
                        label={selectedParticipant.type === 'leader' ? 'Leader' : 'Supporter'}
                        sx={{
                          backgroundColor: selectedParticipant.type === 'leader' ? 'error.light' : 'primary.light',
                          color: 'white',
                          fontWeight: 500,
                          mb: 2,
                          px: 1
                        }}
                      />

                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: { xs: 'center', sm: 'flex-start' },
                          p: 2,
                          mt: 1,
                          borderRadius: 2,
                          backgroundColor: alpha(
                            selectedParticipant.checkInStatus ? theme.palette.success.main : theme.palette.grey[500],
                            0.1
                          )
                        }}
                      >
                        {selectedParticipant.checkInStatus ? (
                          <>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                              <CheckCircleOutline sx={{ color: 'success.main', mr: 1, fontSize: 20 }} />
                              <Typography variant="body1" color="success.main" fontWeight={500}>
                                Đã check-in
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              Thời gian: {new Date(selectedParticipant.checkInTime).toLocaleString()}
                            </Typography>
                            {selectedParticipant.checkedInBy && (
                              <Typography variant="body2" color="text.secondary">
                                Check-in bởi: {selectedParticipant.checkedInBy.name}
                              </Typography>
                            )}
                          </>
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <HourglassEmpty sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
                            <Typography variant="body1" color="text.secondary" fontWeight={500}>
                              Chưa check-in
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Box>

                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Add />}
                    onClick={handleAddEvaluation}
                    sx={{
                      mb: 3,
                      borderRadius: 6,
                      px: 3,
                      py: 1,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      fontWeight: 600
                    }}
                  >
                    Thêm đánh giá
                  </Button>

                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : evaluations.length > 0 ? (
                    <Box>
                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{
                          fontWeight: 600,
                          position: 'relative',
                          display: 'inline-block',
                          mb: 3,
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            bottom: -4,
                            left: 0,
                            width: '50%',
                            height: 2,
                            borderRadius: 1,
                            backgroundColor: 'primary.light',
                          }
                        }}
                      >
                        Các đánh giá hiện có:
                      </Typography>
                      {evaluations.map((evaluation, evalIndex) => (
                        <Zoom
                          in={true}
                          key={evaluation._id}
                          style={{
                            transitionDelay: `${evalIndex * 100}ms`,
                            transitionDuration: '0.3s'
                          }}
                        >
                          <Paper
                            variant="outlined"
                            sx={{
                              p: 3,
                              mb: 2,
                              borderRadius: 2,
                              borderColor: 'rgba(0, 0, 0, 0.1)',
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                              '&:hover': {
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                              }
                            }}
                          >
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                mb: 2,
                                pb: 1.5,
                                borderBottom: '1px solid',
                                borderColor: 'divider'
                              }}
                            >
                              <Avatar
                                sx={{
                                  width: 36,
                                  height: 36,
                                  mr: 1.5,
                                  bgcolor: 'primary.main',
                                  fontSize: '0.9rem'
                                }}
                              >
                                {(evaluation.evaluatorId?.name || 'U').charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle1" fontWeight="medium">
                                  {evaluation.evaluatorId?.name || 'Unknown'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(evaluation.createdAt).toLocaleString()}
                                </Typography>
                              </Box>
                            </Box>

                            {/* Lọc và chỉ hiển thị những tiêu chí có nhận xét (evidence) */}
                            {evaluation.criteria
                              .filter(criterion => criterion.evidence && criterion.evidence.trim() !== '')
                              .map((criterion, index) => (
                                <Box
                                  key={index}
                                  sx={{
                                    mb: 2,
                                    p: 1.5,
                                    borderRadius: 1,
                                    backgroundColor: alpha(theme.palette.primary.main, 0.03)
                                  }}
                                >
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="subtitle1" fontWeight="medium" color="primary.dark">
                                      {criterion.name}
                                    </Typography>
                                    <Rating value={criterion.score} readOnly precision={0.5} />
                                  </Box>
                                  <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
                                    {criterion.evidence}
                                  </Typography>
                                </Box>
                              ))
                            }

                            {/* Hiển thị thông báo nếu không có tiêu chí nào có evidence */}
                            {evaluation.criteria.filter(criterion => criterion.evidence && criterion.evidence.trim() !== '').length === 0 && (
                              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', my: 1 }}>
                                Không có nhận xét chi tiết nào.
                              </Typography>
                            )}
                          </Paper>
                        </Zoom>
                      ))}
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        p: 3,
                        textAlign: 'center',
                        backgroundColor: alpha(theme.palette.primary.main, 0.03),
                        borderRadius: 2
                      }}
                    >
                      <Typography variant="body1" color="text.secondary">
                        Chưa có đánh giá nào cho người tham gia này.
                      </Typography>
                    </Box>
                  )}

                  <Button
                    variant="outlined"
                    startIcon={<ArrowBack />}
                    onClick={() => setSelectedParticipant(null)}
                    sx={{
                      mt: 3,
                      borderRadius: 6,
                      px: 3
                    }}
                  >
                    Quay lại danh sách
                  </Button>
                </Paper>
              </Box>
            </Fade>
          ) : !loading && participants.length > 0 ? (
            <>
              {/* Thêm ô tìm kiếm */}
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
                      sx={{
                        cursor: 'pointer',
                        transition: 'all 0.3s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: '0 12px 20px rgba(0,0,0,0.1)'
                        },
                        borderRadius: 3,
                        overflow: 'hidden',
                        position: 'relative',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: participant.type === 'leader'
                          ? 'rgba(229, 115, 115, 0.05)'
                          : 'rgba(25, 118, 210, 0.05)'
                      }}
                      onClick={() => handleParticipantClick(participant)}
                    >
                      {/* Status indicator */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          zIndex: 2,
                          display: 'flex',
                          alignItems: 'center',
                          backgroundColor: participant.checkInStatus
                            ? 'success.main'
                            : 'text.disabled',
                          color: 'white',
                          borderRadius: 10,
                          px: 1.5,
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

                      {/* Colored top bar */}
                      <Box
                        sx={{
                          height: 8,
                          backgroundColor: participant.type === 'leader' ? 'error.main' : 'primary.main',
                          width: '100%'
                        }}
                      />

                      <CardContent sx={{
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        flexGrow: 1,
                        pt: 3
                      }}>
                        <Box
                          sx={{
                            position: 'relative',
                            mb: 2
                          }}
                        >
                          <Box
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent card click when avatar is clicked
                              if (participant.checkInStatus && participant.checkInPhoto) {
                                handleImageClick(participant);
                              }
                            }}
                            sx={{
                              position: 'relative',
                              '&::after': participant.checkInStatus && participant.checkInPhoto ? {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                borderRadius: '50%',
                                backgroundColor: 'rgba(0,0,0,0.1)',
                                opacity: 0,
                                transition: 'opacity 0.2s',
                                zIndex: 1,
                                cursor: 'pointer'
                              } : {},
                              '&:hover::after': {
                                opacity: 1
                              }
                            }}
                          >
                            {renderAvatar(participant, { width: 100, height: 100 })}
                          </Box>

                          <Box
                            sx={{
                              position: 'absolute',
                              bottom: -6,
                              right: -6,
                              backgroundColor: participant.type === 'leader' ? 'error.main' : 'primary.main',
                              borderRadius: '50%',
                              width: 32,
                              height: 32,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                            }}
                          >
                            {participant.type === 'leader' ?
                              <EmojiPeople sx={{ color: 'white', fontSize: 20 }} /> :
                              <Person sx={{ color: 'white', fontSize: 20 }} />
                            }
                          </Box>
                        </Box>

                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            mb: 1,
                            color: 'text.primary'
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
                            mb: 1.5
                          }}
                        />

                        {participant.checkInStatus && participant.checkedInBy && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              display: 'block',
                              fontStyle: 'italic'
                            }}
                          >
                            Check-in bởi: {participant.checkedInBy.name}
                          </Typography>
                        )}
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
                    p: 2,
                    backgroundColor: 'rgba(0, 0, 0, 0.03)',
                    borderRadius: 2
                  }}>
                    <Typography variant="body1" color="text.secondary">
                      Không tìm thấy người tham gia với từ khóa "{searchQuery}"
                    </Typography>
                  </Box>
                )}
              </Box>
            </>
          ) : !loading && (
            <Box sx={{ textAlign: 'center', width: '100%', mt: 4 }}>
              <Typography variant="h6" color="text.secondary">
                Chưa có người tham gia nào.
              </Typography>
            </Box>
          )}
        </Box>

        {/* Image Dialog */}
        <Dialog
          open={imageDialog.open}
          onClose={handleCloseImageDialog}
          maxWidth="md"
          fullWidth
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
            backgroundColor: 'primary.main',
            color: 'white'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 500 }}>{imageDialog.name}</Typography>
              <IconButton onClick={handleCloseImageDialog} sx={{ color: 'white' }}>
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ p: 0, backgroundColor: '#f5f5f5' }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                p: 2,
                minHeight: '50vh',
                backgroundColor: 'rgba(0,0,0,0.03)'
              }}
            >
              <img
                src={imageDialog.imageUrl}
                alt={imageDialog.name}
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  borderRadius: 8,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
                }}
                onError={(e) => {
                  console.error(`Error loading full image:`, e);
                  e.target.src = '';
                  e.target.alt = 'Không thể tải ảnh';
                }}
              />
            </Box>
          </DialogContent>
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
      </PageContainer>
    </>
  );
};

export default EvaluationPage;