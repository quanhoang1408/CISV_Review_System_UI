// src/pages/CampAssignmentPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import Header from '../components/Header';
import {
  Container, Typography, Box, Grid, Paper, Avatar, 
  Card, CardContent, Divider, CircularProgress, 
  Snackbar, Alert, useTheme, useMediaQuery
} from '@mui/material';
import { Person, EmojiPeople } from '@mui/icons-material';
import { 
  fetchParticipants,
  fetchCampAssignments,
  updateCampAssignment,
  deleteCampAssignment
} from '../utils/api';

// Định nghĩa mảng các trại
const camps = [
  { id: 'camp1', name: 'Trại 1' },
  { id: 'camp2', name: 'Trại 2' },
  { id: 'camp3', name: 'Trại 3' },
  { id: 'camp4', name: 'Trại 4' },
  { id: 'camp5', name: 'Trại 5' },
  { id: 'camp6', name: 'Trại 6' },
];

// Fix drag and drop không hoạt động trong React 18
window._REACT_BEAUTIFUL_DND_OFFSET_ = { x: 0, y: 0 };

const CampAssignmentPage = () => {
  const [participants, setParticipants] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('md'));

  // Lấy danh sách người tham gia và phân công
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Lấy danh sách người tham gia
        const participantsData = await fetchParticipants();
        
        // Lấy phân công trại hiện tại
        const assignmentsData = await fetchCampAssignments();
        
        setParticipants(participantsData);
        
        // Chuyển đổi mảng phân công thành đối tượng cho dễ sử dụng
        const assignmentMap = {};
        assignmentsData.forEach(assignment => {
          assignmentMap[assignment.participantId._id] = {
            campId: assignment.campId,
            position: assignment.position
          };
        });
        
        setAssignments(assignmentMap);
      } catch (error) {
        console.error('Error fetching data:', error);
        showSnackbar('Không thể tải dữ liệu', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const showSnackbar = useCallback((message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Xử lý kết thúc kéo thả
  const handleDragEnd = useCallback(async (result) => {
    const { source, destination, draggableId } = result;
    
    // Không làm gì nếu kéo ra ngoài khu vực thả
    if (!destination) return;
    
    // Không làm gì nếu vị trí không thay đổi
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;
    
    // Lấy thông tin người tham gia được kéo
    const participant = participants.find(p => p._id === draggableId);
    
    if (!participant) {
      console.error('Không tìm thấy người tham gia với ID:', draggableId);
      return;
    }
    
    console.log('Đang kéo:', participant.name, 'từ', source.droppableId, 'đến', destination.droppableId);
    
    // Kiểm tra xem có thả đúng khu vực không
    if (destination.droppableId.startsWith('unassigned-')) {
      // Nếu kéo về khu vực chưa phân công
      const targetType = destination.droppableId.split('-')[1]; // 'leader' hoặc 'supporter'
      
      // Kiểm tra xem type có khớp không
      if (participant.type !== targetType) {
        showSnackbar(`${participant.type === 'leader' ? 'Leader' : 'Supporter'} không thể đặt vào khu vực ${targetType === 'leader' ? 'leader' : 'supporter'}`, 'error');
        return;
      }
      
      try {
        // Xóa phân công nếu đã có
        if (assignments[draggableId]) {
          await deleteCampAssignment(draggableId);
          
          // Cập nhật state
          setAssignments(prev => {
            const newAssignments = { ...prev };
            delete newAssignments[draggableId];
            return newAssignments;
          });
          
          showSnackbar(`Đã xóa phân công của ${participant.name}`, 'info');
        }
      } catch (error) {
        console.error('Error removing assignment:', error);
        showSnackbar('Lỗi khi xóa phân công', 'error');
      }
    } else if (destination.droppableId !== 'unassigned') {
      const [campId, position] = destination.droppableId.split('-');
      
      // Nếu vị trí không khớp với loại người tham gia, hủy bỏ
      if (position !== participant.type) {
        showSnackbar(`${participant.type === 'leader' ? 'Leader' : 'Supporter'} không thể đặt vào khu vực ${position === 'leader' ? 'leader' : 'supporter'}`, 'error');
        return;
      }
      
      // Kiểm tra xem khu vực đã đầy chưa
      const participantsInDestination = Object.entries(assignments)
        .filter(([_, assign]) => assign.campId === campId && assign.position === position)
        .length;
      
      const maxCount = position === 'leader' ? 8 : 3;
      if (participantsInDestination >= maxCount && !assignments[draggableId]?.campId === campId) {
        showSnackbar(`Khu vực ${position} của ${camps.find(c => c.id === campId).name} đã đủ số lượng`, 'error');
        return;
      }
      
      try {
        // Gọi API để cập nhật phân công
        await updateCampAssignment({
          participantId: draggableId,
          campId,
          position
        });
        
        // Cập nhật state
        setAssignments(prev => ({
          ...prev,
          [draggableId]: { campId, position }
        }));
        
        showSnackbar(`Đã phân công ${participant.name} vào ${camps.find(c => c.id === campId).name}`, 'success');
      } catch (error) {
        console.error('Error updating assignment:', error);
        showSnackbar('Lỗi khi cập nhật phân công', 'error');
      }
    } else {
      // Nếu kéo về khu vực chưa phân công
      try {
        // Xóa phân công nếu đã có
        if (assignments[draggableId]) {
          await deleteCampAssignment(draggableId);
          
          // Cập nhật state
          setAssignments(prev => {
            const newAssignments = { ...prev };
            delete newAssignments[draggableId];
            return newAssignments;
          });
          
          showSnackbar(`Đã xóa phân công của ${participant.name}`, 'info');
        }
      } catch (error) {
        console.error('Error removing assignment:', error);
        showSnackbar('Lỗi khi xóa phân công', 'error');
      }
    }
  }, [participants, assignments, showSnackbar]);

  // Lọc người tham gia chưa được phân công theo loại
  const getUnassignedParticipantsByType = useCallback((type) => {
    return participants.filter(p => !assignments[p._id] && p.type === type);
  }, [participants, assignments]);

  // Lấy người tham gia theo trại và vị trí
  const getParticipantsByCampAndPosition = useCallback((campId, position) => {
    return participants.filter(p => 
      assignments[p._id]?.campId === campId && 
      assignments[p._id]?.position === position &&
      p.type === position
    );
  }, [participants, assignments]);

  // Render avatar với xử lý lỗi
  const renderAvatar = (participant, size = { width: 50, height: 50 }) => {
    if (participant.checkInStatus && participant.checkInPhoto) {
      return (
        <Avatar 
          src={participant.checkInPhoto} 
          alt={participant.name}
          sx={{ ...size }}
          onError={(e) => {
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
          sx={{ 
            ...size, 
            bgcolor: participant.type === 'leader' ? 'error.light' : 'primary.light'
          }}
        >
          {participant.name.charAt(0).toUpperCase()}
        </Avatar>
      );
    }
  };

  // Render người tham gia trong Draggable
  const renderParticipantCard = (participant, index) => (
    <Draggable 
      key={participant._id} 
      draggableId={participant._id} 
      index={index}
    >
      {(provided) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          sx={{ 
            mb: 1, 
            borderLeft: 4,
            borderColor: participant.type === 'leader' ? 'error.main' : 'primary.main',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'scale(1.02)' }
          }}
        >
          <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {renderAvatar(participant, { width: 40, height: 40 })}
              <Typography variant="body2" sx={{ ml: 1, fontWeight: 'medium' }}>
                {participant.name}
              </Typography>
              {participant.type === 'leader' ? (
                <EmojiPeople color="error" sx={{ ml: 'auto', fontSize: 20 }} />
              ) : (
                <Person color="primary" sx={{ ml: 'auto', fontSize: 20 }} />
              )}
            </Box>
          </CardContent>
        </Card>
      )}
    </Draggable>
  );

  // Render khu vực trống cho trại
  const renderEmptySlots = (campId, position, filledCount) => {
    const slots = [];
    const maxSlots = position === 'leader' ? 8 : 3;
    const remainingSlots = Math.max(0, maxSlots - filledCount);

    for (let i = 0; i < remainingSlots; i++) {
      slots.push(
        <Paper
          key={`empty-${campId}-${position}-${i}`}
          variant="outlined"
          sx={{ 
            height: 58, 
            mb: 1, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            border: '1px dashed',
            borderColor: position === 'leader' ? 'error.light' : 'primary.light'
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Trống
          </Typography>
        </Paper>
      );
    }

    return slots;
  };

  return (
    <>
      <Header title="CISV Meme System" />
      <Container maxWidth="xl">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" sx={{ mb: 4 }}>
            Phân công trại
          </Typography>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Grid container spacing={3}>
                {/* Khu vực chưa phân công */}
                <Grid item xs={12}>
                  <Paper 
                    elevation={3} 
                    sx={{ p: 2, mb: 3, bgcolor: 'grey.100' }}
                  >
                    <Typography variant="h6" gutterBottom>
                      Chưa phân công
                    </Typography>
                    
                    {/* Leaders chưa phân công */}
                    <Box sx={{ mb: 3 }}>
                      <Typography 
                        variant="subtitle1" 
                        sx={{ mb: 1, color: 'error.main', fontWeight: 'medium' }}
                      >
                        Leaders
                      </Typography>
                      <Droppable droppableId="unassigned-leader" direction="horizontal">
                        {(provided) => (
                          <Box
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            sx={{ 
                              display: 'flex', 
                              flexWrap: 'wrap', 
                              gap: 1,
                              minHeight: 80,
                              bgcolor: 'rgba(255, 0, 0, 0.03)',
                              p: 1,
                              borderRadius: 1
                            }}
                          >
                            {getUnassignedParticipantsByType('leader').map((participant, index) => (
                              <Box key={participant._id} sx={{ width: 200 }}>
                                {renderParticipantCard(participant, index)}
                              </Box>
                            ))}
                            {provided.placeholder}
                          </Box>
                        )}
                      </Droppable>
                    </Box>
                    
                    {/* Supporters chưa phân công */}
                    <Box>
                      <Typography 
                        variant="subtitle1" 
                        sx={{ mb: 1, color: 'primary.main', fontWeight: 'medium' }}
                      >
                        Supporters
                      </Typography>
                      <Droppable droppableId="unassigned-supporter" direction="horizontal">
                        {(provided) => (
                          <Box
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            sx={{ 
                              display: 'flex', 
                              flexWrap: 'wrap', 
                              gap: 1,
                              minHeight: 80,
                              bgcolor: 'rgba(0, 0, 255, 0.03)',
                              p: 1,
                              borderRadius: 1
                            }}
                          >
                            {getUnassignedParticipantsByType('supporter').map((participant, index) => (
                              <Box key={participant._id} sx={{ width: 200 }}>
                                {renderParticipantCard(participant, index)}
                              </Box>
                            ))}
                            {provided.placeholder}
                          </Box>
                        )}
                      </Droppable>
                    </Box>
                  </Paper>
                </Grid>
                
                {/* Hiển thị 6 trại */}
                {camps.map((camp) => (
                  <Grid item xs={12} sm={6} md={4} lg={2} key={camp.id}>
                    <Paper 
                      elevation={2} 
                      sx={{ p: 2, mb: 3, bgcolor: 'rgba(63, 81, 181, 0.05)' }}
                    >
                      <Typography variant="h6" gutterBottom>
                        {camp.name}
                      </Typography>
                      
                      {/* Khu vực Leaders */}
                      <Box sx={{ mb: 2 }}>
                        <Typography 
                          variant="subtitle1" 
                          sx={{ mb: 1, color: 'error.main', fontWeight: 'medium' }}
                        >
                          Leaders (8)
                        </Typography>
                        <Droppable droppableId={`${camp.id}-leader`}>
                          {(provided) => (
                            <Box
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              sx={{ 
                                bgcolor: 'rgba(255, 0, 0, 0.03)', 
                                p: 1, 
                                borderRadius: 1,
                                minHeight: isSmall ? 100 : 520
                              }}
                            >
                              {getParticipantsByCampAndPosition(camp.id, 'leader')
                                .map((participant, index) => (
                                  renderParticipantCard(participant, index)
                                ))
                              }
                              {renderEmptySlots(
                                camp.id, 
                                'leader', 
                                getParticipantsByCampAndPosition(camp.id, 'leader').length
                              )}
                              {provided.placeholder}
                            </Box>
                          )}
                        </Droppable>
                      </Box>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      {/* Khu vực Supporters */}
                      <Box>
                        <Typography 
                          variant="subtitle1" 
                          sx={{ mb: 1, color: 'primary.main', fontWeight: 'medium' }}
                        >
                          Supporters (3)
                        </Typography>
                        <Droppable droppableId={`${camp.id}-supporter`}>
                          {(provided) => (
                            <Box
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              sx={{ 
                                bgcolor: 'rgba(0, 0, 255, 0.03)', 
                                p: 1, 
                                borderRadius: 1,
                                minHeight: isSmall ? 100 : 180
                              }}
                            >
                              {getParticipantsByCampAndPosition(camp.id, 'supporter')
                                .map((participant, index) => (
                                  renderParticipantCard(participant, index)
                                ))
                              }
                              {renderEmptySlots(
                                camp.id, 
                                'supporter', 
                                getParticipantsByCampAndPosition(camp.id, 'supporter').length
                              )}
                              {provided.placeholder}
                            </Box>
                          )}
                        </Droppable>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </DragDropContext>
          )}
        </Box>
        
        {/* Snackbar cho thông báo */}
        <Snackbar 
          open={snackbar.open} 
          autoHideDuration={4000} 
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

export default CampAssignmentPage;