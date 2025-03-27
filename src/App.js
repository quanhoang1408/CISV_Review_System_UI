// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminSelection from './pages/AdminSelection';
import CheckInPage from './pages/CheckInPage';
import EvaluationPage from './pages/EvaluationPage';
import AuthWrapper from './components/AuthWrapper';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AdminSelection />} />
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;