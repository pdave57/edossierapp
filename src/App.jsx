// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Original Components
import Header from "./components/Header";
import Hero from "./components/Hero";
import Ticker from "./components/Ticker";
import Officers from "./components/Officers";
import DashboardComponent from "./components/Dashboard"; // Renamed slightly to avoid clash with Dashboard page
import Systems from "./components/Systems";
import News from "./components/News";
import QuickLinks from "./components/QuickLinks";
import Footer from "./components/Footer";

// New Pages
import Register from './pages/Register';
import Login from './pages/Login';
import Users from './pages/Users';
import About from './pages/AboutPage';
import Dashboard from './pages/Dashboard';

// 1. Private Route Wrapper Component
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function AppContent() {
  return (
    <Router>
      {/* Header stays globally visible, or you can move it inside specific routes if preferred */}
      <Header /> 
      
      <Routes>
        {/* Public Home Page Layout (Your Original Components) */}
        <Route path="/" element={
          <>
            <Hero />
            <Ticker />
            <Officers />
            <DashboardComponent />
            <Systems />
            <News />
            <QuickLinks />
          </>
        } />

        {/* Public Auth Pages */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/About" element={<About />} />

        {/* Protected Dashboard/Admin Routes */}
        <Route path="/users" element={
          <PrivateRoute>
            <Users />
          </PrivateRoute>
        } />
        <Route path="/schools" element={
          <PrivateRoute>
            <div>Schools Management Page</div>
          </PrivateRoute>
        } />
        <Route path="/roles" element={
          <PrivateRoute>
            <div>Roles Management Page</div>
          </PrivateRoute>
        } />
        <Route path="/dashboard" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />
      </Routes>

      <Footer />
    </Router>
  );
}

// 2. Put AuthProvider at the absolute root so AppContent can safely use routing & auth context
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

// import { BrowserRouter, Routes, Route } from "react-router-dom";

// import Header from "./components/Header";
// import Hero from "./components/Hero";
// import Ticker from "./components/Ticker";
// import Officers from "./components/Officers";
// import Dashboard from "./components/Dashboard";
// import Systems from "./components/Systems";
// import News from "./components/News";
// import QuickLinks from "./components/QuickLinks";
// import Footer from "./components/Footer";
// import Login from "./components/Login";
// import Register from "./components/Register";

// function App() {
//   return (
//     <BrowserRouter>
//       <Header />
//       <Routes>
//         <Route path="/" element={<>
//           <Hero />
//           <Ticker />
//           <Officers />
//           <Dashboard />
//           <Systems />
//           <News />
//           <QuickLinks />
//           <Footer />
//         </>} />
//         <Route path="/login" element={<Login />} />
//         <Route path="/register" element={<Register />} />
//       </Routes>
//       <Footer />
//     </BrowserRouter>
//   );
// }

// export default App;
