// src/pages/SupporterRankingPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import {
  Container, Typography, Box, Grid, Paper, Avatar, Rating, Tabs, Tab,
  CircularProgress, Snackbar, Alert, Dialog, DialogContent, DialogTitle, 
  IconButton, Divider, Collapse, Button
} from '@mui/material';
import { 
  Person, 
  Close, 
  KeyboardArrowDown, 
  KeyboardArrowUp 
} from '@mui/icons-material';

// Criteria names (matching those in EvaluationForm)
const criteriaList = [
  "Năng lượng",
  "Thái độ",
  "Kỹ năng giải quyết vấn đề",
  "Kỹ năng làm việc nhóm",
  "Sự chủ động"
];

const SupporterRankingPage = () => {
  const [supporters, setSupporters] = useState([]);
  const [evaluations, setEvaluations] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCriterion, setSelectedCriterion] = useState(0); // Default to first criterion
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [imageDialog, setImageDialog] = useState({ open: false, imageUrl: '', name: '' });
  const [expandedSupporter, setExpandedSupporter] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all participants
        const participantsResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/participants`);
        
        // Filter only supporters
        const supportersOnly = participantsResponse.data.filter(
          participant => participant.type === 'supporter'
        );
        
        // Fetch evaluations for all supporters in parallel
        const evaluationPromises = supportersOnly.map(supporter => 
          axios.get(`${process.env.REACT_APP_API_URL}/api/evaluations/${supporter._id}`)
            .then(response => ({ supporterId: supporter._id, evaluations: response.data }))
            .catch(error => {
              console.error(`Error fetching evaluations for ${supporter.name}:`, error);
              return { supporterId: supporter._id, evaluations: [] };
            })
        );
        
        const evaluationResults = await Promise.all(evaluationPromises);
        
        // Convert array of results to map object
        const evaluationsMap = {};
        evaluationResults.forEach(result => {
          evaluationsMap[result.supporterId] = result.evaluations;
        });
        
        setSupporters(supportersOnly);
        setEvaluations(evaluationsMap);
      } catch (error) {
        console.error('Error fetching data:', error);
        showSnackbar('Không thể tải dữ liệu', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleTabChange = (event, newValue) => {
    setSelectedCriterion(newValue);
    setExpandedSupporter(null); // Collapse any expanded details when changing tabs
  };

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

  const toggleExpandSupporter = (supporterId) => {
    setExpandedSupporter(expandedSupporter === supporterId ? null : supporterId);
  };

  // Calculate average score for a given supporter and criterion
  const calculateAverageScore = (supporterId, criterionIndex) => {
    const supporterEvaluations = evaluations[supporterId] || [];
    
    if (supporterEvaluations.length === 0) {
      return 0;
    }
    
    const criterionName = criteriaList[criterionIndex];
    let totalScore = 0;
    let count = 0;
    
    supporterEvaluations.forEach(evaluation => {
      const criterionData = evaluation.criteria.find(c => c.name === criterionName);
      if (criterionData && criterionData.score) {
        totalScore += criterionData.score;
        count++;
      }
    });
    
    return count > 0 ? totalScore / count : 0;
  };

  // Get evaluations for the current criterion for a supporter
  const getCriterionEvaluations = (supporterId) => {
    const supporterEvaluations = evaluations[supporterId] || [];
    const criterionName = criteriaList[selectedCriterion];
    
    return supporterEvaluations
      .map(evaluation => {
        const criterionData = evaluation.criteria.find(c => c.name === criterionName);
        if (criterionData && criterionData.score) {
          return {
            id: evaluation._id,
            score: criterionData.score,
            evidence: criterionData.evidence,
            evaluator: evaluation.evaluatorId?.name || 'Unknown',
            date: new Date(evaluation.createdAt).toLocaleString()
          };
        }
        return null;
      })
      .filter(item => item !== null && item.evidence && item.evidence.trim() !== '');
  };

  // Sort supporters based on selected criterion
  const getSortedSupporters = () => {
    return [...supporters].sort((a, b) => {
      const scoreA = calculateAverageScore(a._id, selectedCriterion);
      const scoreB = calculateAverageScore(b._id, selectedCriterion);
      return scoreB - scoreA; // Sort in descending order
    });
  };

  // Helper function to render avatar with error handling
  const renderAvatar = (participant, size = { width: 80, height: 80 }, clickable = true) => {
    if (participant.checkInStatus && participant.checkInPhoto) {
      return (
        <Avatar 
          src={participant.checkInPhoto} 
          alt={participant.name}
          sx={{ 
            ...size,
            cursor: clickable ? 'pointer' : 'default',
            '&:hover': clickable ? { 
              boxShadow: 3,
              transform: 'scale(1.05)'
            } : {}
          }}
          onClick={clickable ? () => handleImageClick(participant) : undefined}
          onError={(e) => {
            console.error(`Error loading image for ${participant.name}:`, e);
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
          sx={{ ...size, bgcolor: 'primary.light' }}
        >
          {participant.name.charAt(0).toUpperCase()}
        </Avatar>
      );
    }
  };

  return (
    <>
      <Header title="CISV Meme System" />
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" sx={{ mb: 4 }}>
            Xếp hạng Supporter
          </Typography>
          
          {/* Criteria tabs */}
          <Paper elevation={1} sx={{ mb: 4 }}>
            <Tabs
              value={selectedCriterion}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              textColor="primary"
              indicatorColor="primary"
              aria-label="Tiêu chí"
            >
              {criteriaList.map((criterion, index) => (
                <Tab key={index} label={criterion} />
              ))}
            </Tabs>
          </Paper>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : supporters.length > 0 ? (
            <Grid container spacing={3}>
              {getSortedSupporters().map((supporter, index) => {
                const averageScore = calculateAverageScore(supporter._id, selectedCriterion);
                const isExpanded = expandedSupporter === supporter._id;
                const criterionEvaluations = getCriterionEvaluations(supporter._id);
                
                return (
                  <Grid item xs={12} key={supporter._id}>
                    <Paper 
                      elevation={2} 
                      sx={{ 
                        p: 2, 
                        borderLeft: 6, 
                        borderColor: 'primary.main',
                        backgroundColor: 'rgba(0, 0, 255, 0.05)'
                      }}
                    >
                      {/* Main supporter information row */}
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ mr: 2, display: 'flex', alignItems: 'center', width: 50 }}>
                          <Typography variant="h5" fontWeight="bold" color="text.secondary">
                            #{index + 1}
                          </Typography>
                        </Box>
                        
                        {renderAvatar(supporter, { width: 60, height: 60 })}
                        
                        <Box sx={{ ml: 2, flexGrow: 1 }}>
                          <Typography variant="h6">
                            {supporter.name}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                              {criteriaList[selectedCriterion]}:
                            </Typography>
                            <Rating 
                              value={averageScore} 
                              readOnly 
                              precision={0.1} 
                              size="small" 
                            />
                            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                              ({averageScore.toFixed(1)})
                            </Typography>
                          </Box>
                          
                          <Typography variant="body2" color={supporter.checkInStatus ? "success.main" : "text.secondary"} sx={{ mt: 0.5 }}>
                            {supporter.checkInStatus ? "Đã check-in" : "Chưa check-in"}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                            Số đánh giá: {evaluations[supporter._id]?.length || 0}
                          </Typography>
                          
                          {criterionEvaluations.length > 0 && (
                            <IconButton
                              onClick={() => toggleExpandSupporter(supporter._id)}
                              size="small"
                              sx={{ ml: 1 }}
                            >
                              {isExpanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                            </IconButton>
                          )}
                        </Box>
                      </Box>
                      
                      {/* Expandable evaluation details */}
                      <Collapse in={isExpanded}>
                        <Box sx={{ mt: 2, pl: 14 }}>
                          <Divider sx={{ mb: 2 }} />
                          <Typography variant="subtitle1" gutterBottom>
                            Đánh giá về {criteriaList[selectedCriterion].toLowerCase()}:
                          </Typography>
                          
                          {criterionEvaluations.length > 0 ? (
                            criterionEvaluations.map((evaluation, idx) => (
                              <Paper key={idx} variant="outlined" sx={{ mb: 2, p: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                  <Typography variant="subtitle2" color="text.secondary">
                                    Người đánh giá: {evaluation.evaluator}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {evaluation.date}
                                  </Typography>
                                </Box>
                                
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                  <Typography variant="body2" sx={{ mr: 1 }}>
                                    Điểm số:
                                  </Typography>
                                  <Rating value={evaluation.score} readOnly size="small" />
                                </Box>
                                
                                <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 1 }}>
                                  "{evaluation.evidence}"
                                </Typography>
                              </Paper>
                            ))
                          ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              Không có nhận xét chi tiết nào cho tiêu chí này.
                            </Typography>
                          )}
                        </Box>
                      </Collapse>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center', p: 4 }}>
              <Typography variant="h6" color="text.secondary">
                Không có supporter nào.
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
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">{imageDialog.name}</Typography>
              <IconButton onClick={handleCloseImageDialog}>
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <img 
                src={imageDialog.imageUrl} 
                alt={imageDialog.name}
                style={{ maxWidth: '100%', maxHeight: '70vh' }}
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
    </>
  );
};

export default SupporterRankingPage;