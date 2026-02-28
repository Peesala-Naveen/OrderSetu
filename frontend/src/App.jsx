import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Customer from './Pages/customer/customer'
import Chef from './Pages/chef/chef'
import Owner from './Pages/owner/owner'
import Waiter from './Pages/waiter/waiter'
import Login from './Pages/login/login'
import Register from './Pages/login/register'
import Home from './Pages/home/home'

// ProtectedRoute component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/customer" element={<Customer mode="customer" />} />
        <Route
          path="/chef"
          element={
            <ProtectedRoute>
              <Chef mode="chef" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner"
          element={
            <ProtectedRoute>
              <Owner mode="owner" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/waiter"
          element={
            <ProtectedRoute>
              <Waiter mode="waiter" />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  )
}

export default App;