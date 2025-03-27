import React from 'react';
import { Navigate } from 'react-router-dom';

const AuthWrapper = ({ children }) => {
  const admin = localStorage.getItem('currentAdmin');
  
  if (!admin) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

export default AuthWrapper;