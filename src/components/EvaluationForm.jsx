// src/components/EvaluationForm.jsx
import React, { useState } from 'react';
import {
  Box, Typography, Rating, TextField, Button,
  Divider, Stack, Grid, Alert
} from '@mui/material';

// Tiêu chí đánh giá cho Leader
const leaderCriteria = [
  { name: "Năng lượng", description: "Mức độ tích cực, nhiệt tình trong hoạt động" },
  { name: "Kỷ luật", description: "Tuân thủ nội quy, quy định và thời gian" },
  { name: "Mức độ quan tâm/sẵn sàng", description: "Sự quan tâm đến người khác và sẵn sàng tham gia" },
  { name: "Giải quyết vấn đề", description: "Khả năng xử lý tình huống, giải quyết khó khăn" },
  { name: "Làm việc nhóm", description: "Khả năng hợp tác, chia sẻ và hỗ trợ người khác" },
  { name: "Giao tiếp", description: "Khả năng truyền đạt thông tin và lắng nghe" },
  { name: "Tâm lý độ tuổi kid", description: "Hiểu biết và ứng xử phù hợp với tâm lý trẻ em" },
  { name: "CISV Skills", description: "Kỹ năng đặc thù của CISV" }
];

// Tiêu chí đánh giá cho Supporter
const supporterCriteria = [
  { name: "Năng lượng", description: "Mức độ tích cực, nhiệt tình trong hoạt động" },
  { name: "Thái độ & sự tập trung", description: "Thái độ tôn trọng, lịch sự và khả năng tập trung" },
  { name: "Nhận thức bản thân", description: "Khả năng nhận biết điểm mạnh, điểm yếu và cảm xúc của bản thân" },
  { name: "Tư duy phản biện", description: "Khả năng phân tích, đánh giá và đưa ra ý kiến độc lập" },
  { name: "Teamwork", description: "Khả năng làm việc nhóm, hợp tác và đóng góp" },
  { name: "Giao tiếp & kết nối", description: "Khả năng giao tiếp, kết nối với người khác" },
  { name: "Truyền đạt kinh nghiệm", description: "Khả năng chia sẻ kinh nghiệm và kiến thức với người khác" }
];

const EvaluationForm = ({ participant, onSubmit, onCancel }) => {
  // Chọn tiêu chí dựa trên loại người tham gia (leader hoặc supporter)
  const criteria = participant.type === 'leader' ? leaderCriteria : supporterCriteria;

  const [evaluations, setEvaluations] = useState(
    criteria.map(criterion => ({
      name: criterion.name,
      score: 0,
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

    // Lọc ra những tiêu chí có nhận xét
    const evaluationsWithEvidence = evaluations.filter(
      evaluation => evaluation.evidence.trim() !== ''
    );

    // Kiểm tra xem có ít nhất một minh chứng được nhập không
    if (evaluationsWithEvidence.length === 0) {
      setError('Vui lòng nhập ít nhất một minh chứng');
      return;
    }

    setError('');
    // Chỉ gửi những tiêu chí có nhận xét
    onSubmit(evaluationsWithEvidence);
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(0, 0, 255, 0.03) 0%, rgba(0, 0, 255, 0) 70%)',
          opacity: participant.type === 'leader' ? 0.5 : 1,
          pointerEvents: 'none',
          zIndex: -1
        }
      }}
    >
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'space-between',
        mb: 4
      }}>
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              position: 'relative',
              display: 'inline-block',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: -8,
                left: 0,
                width: '40%',
                height: 3,
                borderRadius: 2,
                backgroundColor: participant.type === 'leader' ? 'error.main' : 'primary.main',
              }
            }}
          >
            Đánh giá cho: {participant.name}
          </Typography>

          <Typography
            variant="subtitle1"
            color={participant.type === 'leader' ? "error.main" : "primary.main"}
            sx={{ mt: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}
          >
            <Box
              component="span"
              sx={{
                display: 'inline-block',
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: participant.type === 'leader' ? 'error.main' : 'primary.main',
                mr: 1
              }}
            />
            {participant.type === 'leader' ? 'Leader' : 'Supporter'}
          </Typography>
        </Box>

        <Box sx={{ mt: { xs: 2, sm: 0 } }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            Chỉ những tiêu chí có nhận xét mới được lưu
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          {error}
        </Alert>
      )}

      {criteria.map((criterion, index) => (
        <Box
          key={index}
          sx={{
            mb: 4,
            p: 3,
            borderRadius: 2,
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            backgroundColor: 'white',
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
              transform: 'translateY(-2px)'
            }
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <Typography
                variant="h6"
                component="legend"
                sx={{
                  fontWeight: 600,
                  color: participant.type === 'leader' ? 'error.dark' : 'primary.dark'
                }}
              >
                {criterion.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {criterion.description}
              </Typography>
            </Grid>
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Rating
                  name={`rating-${index}`}
                  value={evaluations[index].score}
                  onChange={(event, newValue) => handleScoreChange(index, newValue)}
                  size="large"
                  sx={{
                    '& .MuiRating-iconFilled': {
                      color: participant.type === 'leader' ? 'error.main' : 'primary.main',
                    },
                    '& .MuiRating-iconHover': {
                      color: participant.type === 'leader' ? 'error.light' : 'primary.light',
                    }
                  }}
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ ml: 2, minWidth: 30 }}
                >
                  {evaluations[index].score > 0 ? `${evaluations[index].score}/5` : ''}
                </Typography>
              </Box>
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
            sx={{
              mt: 2,
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': {
                  borderColor: participant.type === 'leader' ? 'error.main' : 'primary.main',
                },
              },
            }}
          />
        </Box>
      ))}

      <Stack
        direction="row"
        spacing={2}
        justifyContent="flex-end"
        sx={{
          mt: 4,
          position: 'sticky',
          bottom: 16,
          backgroundColor: 'white',
          p: 2,
          borderRadius: 2,
          boxShadow: '0 -4px 10px rgba(0,0,0,0.05)',
          zIndex: 10
        }}
      >
        <Button
          variant="outlined"
          color={participant.type === 'leader' ? "error" : "primary"}
          onClick={onCancel}
          sx={{
            borderRadius: 2,
            px: 3
          }}
        >
          Hủy
        </Button>
        <Button
          type="submit"
          variant="contained"
          color={participant.type === 'leader' ? "error" : "primary"}
          sx={{
            borderRadius: 2,
            px: 3,
            boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
          }}
        >
          Lưu đánh giá
        </Button>
      </Stack>
    </Box>
  );
};

export default EvaluationForm;