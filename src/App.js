// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AdminSelection from './pages/AdminSelection';
import CheckInPage from './pages/CheckInPage';
import EvaluationPage from './pages/EvaluationPage';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<AdminSelection />} />
          <Route path="/checkin" element={<CheckInPage />} />
          <Route path="/evaluation" element={<EvaluationPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;