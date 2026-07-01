// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Original Components
import Header from "./components/Header";
import Hero from "./components/Hero";
import Ticker from "./components/Ticker";
import Officers from "./components/Officers";
import DashboardComponent from "./components/Dashboard"; // placeholder: src/components/Dashboard.jsx not found
import Systems from "./components/Systems";
import News from "./components/News";
import QuickLinks from "./components/QuickLinks";
import Footer from "./components/Footer";

// New Pages
import Register from './pages/Register';
import Login from './pages/Login';
import Users from './pages/Users';
import About from './pages/AboutPage';
import AdminPageLayout from './pages/AdminPageLayout';
import AdminDashboard from './pages/AdminDashboard';
import Roles from './pages/Roles';

// 1. Private Route Wrapper Component
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Routes that use full-screen admin layout (no Header/Footer)
const ADMIN_ROUTES = ["/admindashboard", "/users", "/roles"];

function AdminDashboardRoute() {
  const navigate = useNavigate();
  const handleNavigate = (key) => {
    const routeMap = {
      dashboard: "/admindashboard",
      users: "/users",
      schools: "/schools",
      roles: "/roles",
    };
    const path = routeMap[key];
    if (path) navigate(path);
  };

  return (
    <PrivateRoute>
      <AdminPageLayout
        activeKey="dashboard"
        onNavigate={handleNavigate}
        permissions={null}
      >
        <AdminDashboard />
      </AdminPageLayout>
    </PrivateRoute>
  );
}

function UsersRoute() {
  const navigate = useNavigate();
  const handleNavigate = (key) => {
    const routeMap = {
      dashboard: "/admindashboard",
      users: "/users",
      schools: "/schools",
      roles: "/roles",
      home: "/",
    };
    const path = routeMap[key];
    if (path) navigate(path);
  };

  return (
    <PrivateRoute>
      <AdminPageLayout
        activeKey="users"
        onNavigate={handleNavigate}
        permissions={null}
      >
        <Users />
      </AdminPageLayout>
    </PrivateRoute>
  );
}

function RolesRoute() {
  const navigate = useNavigate();
  const handleNavigate = (key) => {
    const routeMap = {
      dashboard: "/admindashboard",
      users: "/users",
      schools: "/schools",
      roles: "/roles",
      home: "/",
    };
    const path = routeMap[key];
    if (path) navigate(path);
  };

  return (
    <PrivateRoute>
      <AdminPageLayout
        activeKey="roles"
        onNavigate={handleNavigate}
        permissions={null}
      >
        <Roles />
      </AdminPageLayout>
    </PrivateRoute>
  );
}

function AppContent() {
  const location = useLocation();
  const isAdminRoute = ADMIN_ROUTES.some((r) => location.pathname.startsWith(r));

  return (
    <>
      {/* Header/Footer hidden on full-screen admin pages so AdminPageLayout gets 100vh */}
      {!isAdminRoute && <Header />}

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
        <Route path="/users" element={<UsersRoute />} />
        <Route path="/schools" element={
          <PrivateRoute>
            <div>Schools Management Page</div>
          </PrivateRoute>
        } />
        <Route path="/roles" element={<RolesRoute />} />
        <Route path="/admindashboard" element={<AdminDashboardRoute />} />
      </Routes>

      {!isAdminRoute && <Footer />}
    </>
  );
}

// 2. Put AuthProvider at the absolute root so AppContent can safely use routing & auth context
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}