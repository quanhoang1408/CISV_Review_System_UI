// src/components/EvaluationForm.jsx (đã cập nhật)
import React, { useState } from 'react';
import { 
  Box, Typography, Rating, TextField, Button,
  Divider, Stack, Grid, Alert
} from '@mui/material';

const criteria = [
  { name: "Năng lượng", description: "Mức độ tích cực, nhiệt tình trong hoạt động" },
  { name: "Thái độ", description: "Thái độ tôn trọng, lịch sự và hợp tác" },
  { name: "Kỹ năng giải quyết vấn đề", description: "Khả năng xử lý tình huống, giải quyết khó khăn" },
  { name: "Kỹ năng làm việc nhóm", description: "Khả năng hợp tác, chia sẻ và hỗ trợ người khác" },
  { name: "Sự chủ động", description: "Chủ động đề xuất ý tưởng, giải pháp và tham gia" }
];

const EvaluationForm = ({ participant, onSubmit, onCancel }) => {
  const [evaluations, setEvaluations] = useState(
    criteria.map(criterion => ({
      name: criterion.name,
      score: 3,
      evidence: ""
    }))
  );
  
  const [error, setError] = useState('');
  
  const handleScoreChange = (index, newValue) => {
    const newEvaluations = [...evaluations];
    newEvaluations[index].score = newValue;
    setEvaluations(newEvaluations);
  };
  
  const handleEvidenceChange = (index, event) => {
    const newEvaluations = [...evaluations];
    newEvaluations[index].evidence = event.target.value;
    setEvaluations(newEvaluations);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Kiểm tra xem có ít nhất một minh chứng được nhập không
    const hasEvidence = evaluations.some(evaluation => evaluation.evidence.trim() !== '');
    
    if (!hasEvidence) {
      setError('Vui lòng nhập ít nhất một minh chứng');
      return;
    }
    
    setError('');
    onSubmit(evaluations);
  };
  
  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h5" gutterBottom>
        Đánh giá cho: {participant.name}
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {criteria.map((criterion, index) => (
        <Box key={index} sx={{ mb: 4 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <Typography variant="h6" component="legend">{criterion.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {criterion.description}
              </Typography>
            </Grid>
            <Grid item xs={12} md={8}>
              <Rating
                name={`rating-${index}`}
                value={evaluations[index].score}
                onChange={(event, newValue) => handleScoreChange(index, newValue)}
                size="large"
              />
            </Grid>
          </Grid>
          
          <TextField
            label="Minh chứng"
            multiline
            rows={3}
            fullWidth
            margin="normal"
            variant="outlined"
            value={evaluations[index].evidence}
            onChange={(e) => handleEvidenceChange(index, e)}
            placeholder="Nhập minh chứng cụ thể cho đánh giá này (không bắt buộc)"
            // Đã loại bỏ thuộc tính required
          />
          
          {index < criteria.length - 1 && <Divider sx={{ my: 2 }} />}
        </Box>
      ))}
      
      <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 4 }}>
        <Button 
          variant="outlined" 
          color="inherit" 
          onClick={onCancel}
        >
          Hủy
        </Button>
        <Button 
          type="submit" 
          variant="contained" 
          color="primary"
        >
          Lưu đánh giá
        </Button>
      </Stack>
    </Box>
  );
};

export default EvaluationForm;