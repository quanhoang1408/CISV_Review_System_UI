import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const AuthWrapper = ({ children, requireSuperAdmin = false }) => {
  const admin = localStorage.getItem('currentAdmin');
  const location = useLocation();

  // Nếu không có admin, chuyển hướng về trang đăng nhập
  if (!admin) {
    return <Navigate to="/" replace />;
  }

  // Nếu trang yêu cầu quyền super admin
  if (requireSuperAdmin) {
    const adminData = JSON.parse(admin);
    const isSuperAdmin = adminData.isSuperAdmin || adminData.name === 'Quân Hoàng';

    // Nếu không phải super admin, chuyển hướng về trang chính
    if (!isSuperAdmin) {
      return <Navigate to="/checkin" replace />;
    }
  }

  return children;
};

export default AuthWrapper;