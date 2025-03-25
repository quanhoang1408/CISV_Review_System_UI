// src/pages/AdminSelection.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Container, Box, Typography, FormControl, 
  InputLabel, Select, MenuItem, Button, Paper
} from '@mui/material';

const AdminSelection = () => {
  const [admins, setAdmins] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/users`);
        setAdmins(response.data);
      } catch (error) {
        console.error('Error fetching admins:', error);
      }
    };

    fetchAdmins();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedAdmin) {
      const admin = admins.find(admin => admin._id === selectedAdmin);
      localStorage.setItem('currentAdmin', JSON.stringify(admin));
      navigate('/checkin');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Bạn là ai?
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="admin-select-label">Chọn tên của bạn</InputLabel>
              <Select
                labelId="admin-select-label"
                value={selectedAdmin}
                label="Chọn tên của bạn"
                onChange={(e) => setSelectedAdmin(e.target.value)}
                required
              >
                {admins.map(admin => (
                  <MenuItem key={admin._id} value={admin._id}>
                    {admin.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button 
              type="submit" 
              fullWidth 
              variant="contained" 
              sx={{ mt: 2 }}
              disabled={!selectedAdmin}
            >
              Tiếp tục
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default AdminSelection;