// src/components/PageContainer.jsx
import React from 'react';
import { Container, Box, useTheme } from '@mui/material';

/**
 * A consistent container for all pages with proper spacing and styling
 */
const PageContainer = ({ children, maxWidth = "lg" }) => {
  const theme = useTheme();
  
  return (
    <>
      {/* Toolbar spacer to account for fixed header */}
      <Box sx={{ height: { xs: 56, sm: 64 } }} />
      
      <Container 
        maxWidth={maxWidth}
        sx={{ 
          py: { xs: 3, sm: 4 },
          px: { xs: 2, sm: 3 },
          minHeight: 'calc(100vh - 64px)',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '100%',
            backgroundImage: 'radial-gradient(circle at 25px 25px, #f5f5f5 2%, transparent 0%), radial-gradient(circle at 75px 75px, #f5f5f5 2%, transparent 0%)',
            backgroundSize: '100px 100px',
            opacity: 0.4,
            zIndex: -1,
          }
        }}
      >
        {children}
      </Container>
    </>
  );
};

export default PageContainer;
