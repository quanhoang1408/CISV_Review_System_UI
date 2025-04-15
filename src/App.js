// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

// Pages
import AdminSelection from './pages/AdminSelection';
import CheckInPage from './pages/CheckInPage';
import EvaluationPage from './pages/EvaluationPage';
import SupporterRankingPage from './pages/SupporterRankingPage';
import CampAssignmentPage from './pages/CampAssignmentPage'; // Thêm import

// Components
import AuthWrapper from './components/AuthWrapper';

// Theme configuration
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#f50057',
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<AdminSelection />} />
          
          {/* Protected routes - require admin authentication */}
          <Route 
            path="/checkin" 
            element={
              <AuthWrapper>
                <CheckInPage />
              </AuthWrapper>
            } 
          />
          <Route 
            path="/evaluation" 
            element={
              <AuthWrapper>
                <EvaluationPage />
              </AuthWrapper>
            } 
          />
          <Route 
            path="/supporters" 
            element={
              <AuthWrapper>
                <SupporterRankingPage />
              </AuthWrapper>
            } 
          />
          <Route 
            path="/camps" 
            element={
              <AuthWrapper>
                <CampAssignmentPage />
              </AuthWrapper>
            } 
          />
          
          {/* Redirect any unknown routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;