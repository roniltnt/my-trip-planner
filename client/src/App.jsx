import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ProtectedRoute from './ProtectedRoute';
import TripPlanner from './pages/TripPlanner';
// import Trips from './pages/Trips'; 

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* ברגע שנוסיף דפים נוספים נכניס אותם פה */}
        {/* נתיב ברירת מחדל שמפנה ל /login */}
        <Route path="/signup" element={<Signup />} />
        <Route path="/planner" element={
        
            <TripPlanner />
        
        } />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
// <Route path="/trips" element={<ProtectedRoute><Trips /></ProtectedRoute>} />

export default App;
