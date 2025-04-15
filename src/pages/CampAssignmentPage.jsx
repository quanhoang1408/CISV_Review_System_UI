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
  deleteCampAssignment,
  updateAssignmentOrder
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

const CampAssignmentPage = () => {
  const [participants, setParticipants] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [orders, setOrders] = useState({});
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('md'));

  // Fix drag and drop không hoạt động trong React 18
  useEffect(() => {
    window._REACT_BEAUTIFUL_DND_OFFSET_ = { x: 0, y: 0 };
  }, []);

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
        const orderMap = {};
        
        assignmentsData.forEach(assignment => {
          assignmentMap[assignment.participantId._id] = {
            campId: assignment.campId,
            position: assignment.position
          };
          
          // Lưu thứ tự
          orderMap[assignment.participantId._id] = assignment.order || 0;
        });
        
        setAssignments(assignmentMap);
        setOrders(orderMap);
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
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Lọc người tham gia chưa được phân công theo loại
  const getUnassignedParticipantsByType = useCallback((type) => {
    return participants.filter(p => !assignments[p._id] && p.type === type);
  }, [participants, assignments]);

  // Lấy người tham gia theo trại và vị trí
  const getParticipantsByCampAndPosition = useCallback((campId, position) => {
    // Lọc người tham gia đã được phân công vào trại và vị trí chỉ định
    const filteredParticipants = participants.filter(p => 
      assignments[p._id]?.campId === campId && 
      assignments[p._id]?.position === position &&
      p.type === position
    );
    
    // Sắp xếp theo thứ tự đã lưu
    return filteredParticipants.sort((a, b) => {
      const orderA = orders[a._id] !== undefined ? orders[a._id] : 0;
      const orderB = orders[b._id] !== undefined ? orders[b._id] : 0;
      return orderA - orderB;
    });
  }, [participants, assignments, orders]);

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
    
    console.log('Đang kéo:', participant.name, 
                'từ', source.droppableId, '(index', source.index, ')', 
                'đến', destination.droppableId, '(index', destination.index, ')');
    
    // Xử lý kéo thả vào khu vực chưa phân công
    if (destination.droppableId.startsWith('unassigned-')) {
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
          
          setOrders(prev => {
            const newOrders = { ...prev };
            delete newOrders[draggableId];
            return newOrders;
          });
          
          showSnackbar(`Đã xóa phân công của ${participant.name}`, 'info');
        }
      } catch (error) {
        console.error('Error removing assignment:', error);
        showSnackbar('Lỗi khi xóa phân công', 'error');
      }
    } 
    // Xử lý kéo thả vào khu vực trại
    else if (destination.droppableId.includes('-')) {
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
      if (participantsInDestination >= maxCount && assignments[draggableId]?.campId !== campId) {
        showSnackbar(`Khu vực ${position} của ${camps.find(c => c.id === campId).name} đã đủ số lượng`, 'error');
        return;
      }
      
      try {
        // Mục tiêu: Di chuyển người tham gia đến vị trí đích chính xác (destination.index)
        // và đẩy các người tham gia khác để giữ cho thứ tự liên tục
        
        // Sao chép orders hiện tại để có thể thay đổi
        const newOrders = { ...orders };
        const destinationIndex = destination.index; // Vị trí mới - đây là order thật sự
        
        // LƯU Ý: Vì index của Draggable bây giờ trùng với order, nên chúng ta cần sử dụng
        // destination.index trực tiếp thay vì tìm kiếm lại vị trí trong mảng participantsInArea
        
        // Lấy danh sách các người tham gia ở khu vực đích (đã được sắp xếp theo order)
        const participantsWithOrder = participants
          .filter(p => 
            assignments[p._id]?.campId === campId && 
            assignments[p._id]?.position === position
          )
          .map(p => ({ 
            participant: p, 
            order: orders[p._id] !== undefined ? orders[p._id] : 0 
          }))
          .sort((a, b) => a.order - b.order);
          
        // Lấy order hiện tại của người tham gia được kéo (nếu đã có trong cùng khu vực)
        const currentOrder = source.droppableId === destination.droppableId 
          ? orders[draggableId] 
          : -1;
        
        // Nếu kéo trong cùng khu vực, xử lý di chuyển
        if (source.droppableId === destination.droppableId) {
          // Khi kéo từ vị trí cao xuống vị trí thấp (ví dụ: từ 2 xuống 5)
          if (currentOrder < destinationIndex) {
            // Di chuyển những người có order từ currentOrder+1 đến destinationIndex lên 1 bậc
            participantsWithOrder.forEach(item => {
              if (item.order > currentOrder && item.order <= destinationIndex) {
                newOrders[item.participant._id] = item.order - 1;
              }
            });
          } 
          // Khi kéo từ vị trí thấp lên vị trí cao (ví dụ: từ 5 lên 2)
          else if (currentOrder > destinationIndex) {
            // Di chuyển những người có order từ destinationIndex đến currentOrder-1 xuống 1 bậc
            participantsWithOrder.forEach(item => {
              if (item.order >= destinationIndex && item.order < currentOrder) {
                newOrders[item.participant._id] = item.order + 1;
              }
            });
          }
        } 
        // Kéo từ khu vực khác vào
        else {
          // Di chuyển tất cả những người có order >= destinationIndex xuống 1 bậc
          participantsWithOrder.forEach(item => {
            if (item.order >= destinationIndex) {
              newOrders[item.participant._id] = item.order + 1;
            }
          });
        }
        
        // Cập nhật order cho người tham gia được kéo
        newOrders[draggableId] = destinationIndex;
        
        // Cập nhật thứ tự trong state
        setOrders(newOrders);
        
        // Gọi API để cập nhật phân công
        await updateCampAssignment({
          participantId: draggableId,
          campId: campId,
          position: position,
          order: destinationIndex
        });
        
        // Cập nhật thông tin phân công trong state
        setAssignments(prev => ({
          ...prev,
          [draggableId]: { campId, position }
        }));
        
        // Cập nhật tất cả thứ tự lên server
        const orderUpdates = Object.entries(newOrders)
          .filter(([id, _]) => 
            assignments[id]?.campId === campId && 
            assignments[id]?.position === position
          )
          .map(([id, order]) => ({
            participantId: id, 
            order
          }));
        
        if (orderUpdates.length > 0) {
          await updateAssignmentOrder(orderUpdates);
        }
        
        showSnackbar(`Đã phân công ${participant.name} vào ${camps.find(c => c.id === campId).name} ở vị trí ${destinationIndex + 1}`, 'success');
      } catch (error) {
        console.error('Error updating assignment:', error);
        showSnackbar('Lỗi khi cập nhật phân công', 'error');
      }
    }
    // Xử lý trường hợp kéo vào khu vực chưa phân công (phiên bản cũ)
    else if (destination.droppableId === 'unassigned') {
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
          
          setOrders(prev => {
            const newOrders = { ...prev };
            delete newOrders[draggableId];
            return newOrders;
          });
          
          showSnackbar(`Đã xóa phân công của ${participant.name}`, 'info');
        }
      } catch (error) {
        console.error('Error removing assignment:', error);
        showSnackbar('Lỗi khi xóa phân công', 'error');
      }
    }
  }, [participants, assignments, orders, getParticipantsByCampAndPosition, showSnackbar]);

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

  // Render vị trí trống (droppable)
  const renderEmptySlot = (campId, position, index) => (
    <Paper
      key={`empty-${campId}-${position}-${index}`}
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
        Vị trí {index + 1}
      </Typography>
    </Paper>
  );

  // THAY ĐỔI Ở ĐÂY: Tạo mảng các vị trí (đã điền và trống) để hiển thị
  const renderPositionSlots = (campId, position) => {
    const maxSlots = position === 'leader' ? 8 : 3;
    const participantsInArea = getParticipantsByCampAndPosition(campId, position);
    
    // Tạo một mảng có maxSlots phần tử, mỗi phần tử là trống hoặc chứa người tham gia
    const slots = Array(maxSlots).fill(null);
    
    // Điền người tham gia vào các vị trí theo order
    participantsInArea.forEach(participant => {
      const order = orders[participant._id];
      if (order !== undefined && order < maxSlots) {
        slots[order] = participant;
      }
    });
    
    // Xử lý những người tham gia có order lớn hơn maxSlots hoặc chưa có order
    const outliers = participantsInArea.filter(p => 
      orders[p._id] === undefined || orders[p._id] >= maxSlots
    );
    
    // Thêm outliers vào những vị trí còn trống
    if (outliers.length > 0) {
      outliers.forEach(participant => {
        const emptyIndex = slots.findIndex(s => s === null);
        if (emptyIndex !== -1) {
          slots[emptyIndex] = participant;
          // Cập nhật order cho participant này
          orders[participant._id] = emptyIndex;
        }
      });
    }
    
    // Chuyển đổi mảng slots thành các phần tử React
    const slotElements = [];
    
    for (let slotIndex = 0; slotIndex < maxSlots; slotIndex++) {
      const participant = slots[slotIndex];
      
      if (participant) {
        // Quan trọng: index của Draggable PHẢI trùng với vị trí hiển thị (slotIndex)
        slotElements.push(
          <Draggable 
            key={participant._id} 
            draggableId={participant._id} 
            index={slotIndex} // Sử dụng slotIndex thay vì index trong mảng participantsInArea
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
      } else {
        slotElements.push(renderEmptySlot(campId, position, slotIndex));
      }
    }
    
    return slotElements;
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
                              {/* THAY ĐỔI: Sử dụng renderPositionSlots thay vì cách cũ */}
                              {renderPositionSlots(camp.id, 'leader')}
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
                              {/* THAY ĐỔI: Sử dụng renderPositionSlots thay vì cách cũ */}
                              {renderPositionSlots(camp.id, 'supporter')}
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