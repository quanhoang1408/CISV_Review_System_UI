// src/utils/api.js - thêm các hàm mới
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

// Base axios configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchUsers = async () => {
  try {
    const response = await api.get('/api/users');
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const fetchParticipants = async () => {
  try {
    const response = await api.get('/api/participants');
    return response.data;
  } catch (error) {
    console.error('Error fetching participants:', error);
    throw error;
  }
};

export const checkInParticipant = async (id, data) => {
  try {
    const response = await api.put(`/api/participants/${id}/checkin`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating participant:', error);
    throw error;
  }
};

export const uploadPhotoBase64 = async (photoData) => {
  try {
    const response = await api.post('/api/upload-photo', { photo: photoData });
    return response.data;
  } catch (error) {
    console.error('Error uploading base64 photo:', error);
    throw error;
  }
};

export const uploadPhotoFile = async (file) => {
  try {
    // Create a form data object
    const formData = new FormData();
    formData.append('photo', file);
    
    // Use axios directly with custom headers for this request
    const response = await axios.post(
      `${API_URL}/api/upload-photo/file`, 
      formData,
      // Important: Don't set Content-Type header manually, let browser set it automatically with boundary
      { headers: {} }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error uploading photo file:', error);
    throw error;
  }
};

export const fetchEvaluations = async (participantId) => {
  try {
    const response = await api.get(`/api/evaluations/${participantId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching evaluations:', error);
    throw error;
  }
};

export const createEvaluation = async (data) => {
  try {
    const response = await api.post('/api/evaluations', data);
    return response.data;
  } catch (error) {
    console.error('Error creating evaluation:', error);
    throw error;
  }
};

// Thêm các hàm mới cho phân công trại
export const fetchCampAssignments = async () => {
  try {
    const response = await api.get('/api/camp-assignments');
    return response.data;
  } catch (error) {
    console.error('Error fetching camp assignments:', error);
    throw error;
  }
};

export const updateCampAssignment = async (data) => {
  try {
    const response = await api.post('/api/camp-assignments', data);
    return response.data;
  } catch (error) {
    console.error('Error updating camp assignment:', error);
    throw error;
  }
};

export const deleteCampAssignment = async (participantId) => {
  try {
    const response = await api.delete(`/api/camp-assignments/${participantId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting camp assignment:', error);
    throw error;
  }
};

export default api;