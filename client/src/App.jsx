import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ProtectedRoute from './ProtectedRoute';
import TripPlanner from './pages/TripPlanner';
import TripHistory from './pages/TripHistory';
import TripView from './pages/TripView';
import Welcome from './pages/Welcome';
import Header from './components/Header';
import { AuthProvider } from './AuthContext';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route
            path="/planner"
            element={
              <ProtectedRoute>
                <TripPlanner />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <TripHistory />
              </ProtectedRoute>
            }
          />

          <Route 
            path="/trips/:id" 
            element={
              <ProtectedRoute>
                <TripView />
              </ProtectedRoute>
            } 
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;