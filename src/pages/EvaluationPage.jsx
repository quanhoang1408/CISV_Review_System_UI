// src/pages/EvaluationPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import EvaluationForm from '../components/EvaluationForm';
import {
  Container, Typography, Box, Grid, Card, CardContent,
  Button, Avatar, Dialog, DialogContent, Paper,
  IconButton, Rating, Divider, CircularProgress, Snackbar, Alert
} from '@mui/material';
import { ArrowBack, Add, PhotoCamera } from '@mui/icons-material';

const EvaluationPage = () => {
  const [participants, setParticipants] = useState([]);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  
  useEffect(() => {
    const admin = localStorage.getItem('currentAdmin');
    if (!admin) {
      window.location.href = '/';
      return;
    }

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
  
  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
  const handleParticipantClick = async (participant) => {
    console.log('Selected participant:', participant);
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

  // Helper function to render avatar with error handling
  const renderAvatar = (participant, size = { width: 100, height: 100 }) => {
    console.log(`Rendering avatar for ${participant.name}, checkInStatus: ${participant.checkInStatus}, photo URL: ${participant.checkInPhoto}`);
    
    if (participant.checkInStatus && participant.checkInPhoto) {
      return (
        <Avatar 
          src={participant.checkInPhoto} 
          alt={participant.name}
          sx={{ ...size, mx: 'auto', mb: 2 }}
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

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            Đánh giá người tham gia
          </Typography>
          <Button 
            component={Link} 
            to="/checkin" 
            variant="contained" 
            color="primary"
          >
            Quay lại trang Check-in
          </Button>
        </Box>
        
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}
        
        {!loading && showForm && selectedParticipant ? (
          <Paper elevation={3} sx={{ p: 3 }}>
            <EvaluationForm 
              participant={selectedParticipant} 
              onSubmit={handleFormSubmit} 
              onCancel={handleCancelForm} 
            />
          </Paper>
        ) : !loading && selectedParticipant ? (
          <Box>
            <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                {renderAvatar(selectedParticipant, { width: 80, height: 80, mr: 2 })}
                <Box>
                  <Typography variant="h5" component="h2">
                    {selectedParticipant.name}
                  </Typography>
                  {selectedParticipant.checkInStatus ? (
                    <Typography variant="body2" color="success.main">
                      Đã check-in: {new Date(selectedParticipant.checkInTime).toLocaleString()}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Chưa check-in
                    </Typography>
                  )}
                </Box>
              </Box>
              
              <Button 
                variant="contained" 
                color="success" 
                startIcon={<Add />}
                onClick={handleAddEvaluation}
                sx={{ mb: 3 }}
              >
                Thêm đánh giá
              </Button>
              
              {evaluations.length > 0 ? (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Các đánh giá hiện có:
                  </Typography>
                  {evaluations.map(evaluation => (
                    <Paper key={evaluation._id} variant="outlined" sx={{ p: 2, mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Đánh giá bởi: {evaluation.evaluatorId?.name || 'Unknown'} - {new Date(evaluation.createdAt).toLocaleString()}
                      </Typography>
                      {evaluation.criteria.map((criterion, index) => (
                        <Box key={index} sx={{ mb: 1, mt: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle1" fontWeight="medium">
                              {criterion.name}:
                            </Typography>
                            <Rating value={criterion.score} readOnly size="small" />
                          </Box>
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {criterion.evidence}
                          </Typography>
                          {index < evaluation.criteria.length - 1 && <Divider sx={{ my: 1 }} />}
                        </Box>
                      ))}
                    </Paper>
                  ))}
                </Box>
              ) : (
                <Typography>
                  Chưa có đánh giá nào cho người tham gia này.
                </Typography>
              )}
              
              <Button 
                startIcon={<ArrowBack />} 
                onClick={() => setSelectedParticipant(null)} 
                sx={{ mt: 2 }}
              >
                Quay lại danh sách
              </Button>
            </Paper>
          </Box>
        ) : !loading && participants.length > 0 ? (
          <Grid container spacing={3}>
            {participants.map(participant => (
              <Grid item xs={6} sm={4} md={3} key={participant._id}>
                <Card 
                  sx={{ 
                    cursor: 'pointer', 
                    transition: '0.3s', 
                    '&:hover': { transform: 'translateY(-5px)', boxShadow: 3 } 
                  }}
                  onClick={() => handleParticipantClick(participant)}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    {renderAvatar(participant)}
                    <Typography variant="h6">
                      {participant.name}
                    </Typography>
                    <Typography variant="body2" color={participant.checkInStatus ? "success.main" : "text.secondary"}>
                      {participant.checkInStatus ? "Đã check-in" : "Chưa check-in"}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : !loading && (
          <Box sx={{ textAlign: 'center', width: '100%', mt: 4 }}>
            <Typography variant="h6" color="text.secondary">
              Chưa có người tham gia nào.
            </Typography>
            <Button 
              component={Link}
              to="/checkin"
              variant="contained"
              sx={{ mt: 2 }}
            >
              Đi đến trang Check-in
            </Button>
          </Box>
        )}
      </Box>
      
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
    </Container>
  );
};

export default EvaluationPage;