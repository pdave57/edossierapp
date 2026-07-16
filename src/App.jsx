// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Original Components
import Header from "./components/Header";
import Hero from "./components/Hero";
import Ticker from "./components/Ticker";
import Officers from "./components/Officers";
import DashboardComponent from "./components/Dashboard";
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
import Permission from './pages/Permission';
import Zones from './pages/Zones';
import Lgas from './pages/Lgas';
import AcademicYears from './pages/AcademicYears';
import Terms from './pages/Terms';
import Levels from './pages/Levels';
import Sublevels from './pages/Sublevels';
import Subjects from './pages/Subjects';
import Schools from './pages/schools';
import SchoolFacility from './pages/SchoolFacility';
import Students from './pages/Students';
import Enrollments from './pages/Enrollments';
import AddEnrollment from './pages/AddEnrollment';
import RegisterStudent from './pages/RegisterStudent';

// Shared navigation map: sidebar/item key -> route path.
const ROUTE_MAP = {
  dashboard: "/admindashboard",
  users: "/users",
  schools: "/schools",
  roles: "/roles",
  permissions: "/permissions",
  zones: "/zones",
  lgas: "/lgas",
  home: "/",
  "academic-years": "/academic-years",
  terms: "/terms",
  levels: "/levels",
  sublevels: "/sublevels",
  subjects: "/subjects",
  facilities: "/facilities",
  students: "/students",
  "student-management": "/students",
  "register-student": "/register-student",
  enrollments: "/enrollments",
  "add-enrollment": "/add-enrollment",
};

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const ADMIN_ROUTES = ["/admindashboard", "/users", "/schools", "/roles", "/permissions", "/zones", "/lgas", "/academic-years", "/terms", "/levels", "/sublevels", "/subjects", "/facilities", "/students", "/register-student", "/enrollments", "/add-enrollment"];

function AdminDashboardRoute() {
  const navigate = useNavigate();
  const handleNavigate = (key) => {
    const path = ROUTE_MAP[key];
    if (path) navigate(path);
  };

  return (
    <PrivateRoute>
      <AdminPageLayout activeKey="dashboard" onNavigate={handleNavigate} permissions={null}>
        <AdminDashboard />
      </AdminPageLayout>
    </PrivateRoute>
  );
}

function UsersRoute() {
  const navigate = useNavigate();
  const handleNavigate = (key) => {
    const path = ROUTE_MAP[key];
    if (path) navigate(path);
  };

  return (
    <PrivateRoute>
      <AdminPageLayout activeKey="users" onNavigate={handleNavigate} permissions={null}>
        <Users />
      </AdminPageLayout>
    </PrivateRoute>
  );
}

function RolesRoute() {
  const navigate = useNavigate();
  const handleNavigate = (key) => {
    const path = ROUTE_MAP[key];
    if (path) navigate(path);
  };

  return (
    <PrivateRoute>
      <AdminPageLayout activeKey="roles" onNavigate={handleNavigate} permissions={null}>
        <Roles />
      </AdminPageLayout>
    </PrivateRoute>
  );
}

function PermissionsRoute() {
  const navigate = useNavigate();
  const handleNavigate = (key) => {
    const path = ROUTE_MAP[key];
    if (path) navigate(path);
  };

  return (
    <PrivateRoute>
      <AdminPageLayout activeKey="permissions" onNavigate={handleNavigate} permissions={null}>
        <Permission />
      </AdminPageLayout>
    </PrivateRoute>
  );
}

function ZonesRoute() {
  const navigate = useNavigate();
  const handleNavigate = (key) => {
    const path = ROUTE_MAP[key];
    if (path) navigate(path);
  };

  return (
    <PrivateRoute>
      <AdminPageLayout activeKey="zones" onNavigate={handleNavigate} permissions={null}>
        <Zones />
      </AdminPageLayout>
    </PrivateRoute>
  );
}

function LgasRoute() {
  const navigate = useNavigate();
  const handleNavigate = (key) => {
    const path = ROUTE_MAP[key];
    if (path) navigate(path);
  };

  return (
    <PrivateRoute>
      <AdminPageLayout activeKey="lgas" onNavigate={handleNavigate} permissions={null}>
        <Lgas />
      </AdminPageLayout>
    </PrivateRoute>
  );
}

function SchoolsRoute() {
  const navigate = useNavigate();
  const handleNavigate = (key) => {
    const path = ROUTE_MAP[key];
    if (path) navigate(path);
  };

  return (
    <PrivateRoute>
      <AdminPageLayout activeKey="schools" onNavigate={handleNavigate} permissions={null}>
        <Schools />
      </AdminPageLayout>
    </PrivateRoute>
  );
}

function AcademicYearsRoute() {
  const navigate = useNavigate();
  const handleNavigate = (key) => {
    const path = ROUTE_MAP[key];
    if (path) navigate(path);
  };

  return (
    <PrivateRoute>
      <AdminPageLayout activeKey="academic-years" onNavigate={handleNavigate} permissions={null}>
        <AcademicYears />
      </AdminPageLayout>
    </PrivateRoute>
  );
}

function TermsRoute() {
  const navigate = useNavigate();
  const handleNavigate = (key) => {
    const path = ROUTE_MAP[key];
    if (path) navigate(path);
  };

  return (
    <PrivateRoute>
      <AdminPageLayout activeKey="terms" onNavigate={handleNavigate} permissions={null}>
        <Terms />
      </AdminPageLayout>
    </PrivateRoute>
  );
}

function LevelsRoute() {
  const navigate = useNavigate();
  const handleNavigate = (key) => {
    const path = ROUTE_MAP[key];
    if (path) navigate(path);
  };

  return (
    <PrivateRoute>
      <AdminPageLayout activeKey="levels" onNavigate={handleNavigate} permissions={null}>
        <Levels />
      </AdminPageLayout>
    </PrivateRoute>
  );
}

function SublevelsRoute() {
  const navigate = useNavigate();
  const handleNavigate = (key) => {
    const path = ROUTE_MAP[key];
    if (path) navigate(path);
  };

  return (
    <PrivateRoute>
      <AdminPageLayout activeKey="sublevels" onNavigate={handleNavigate} permissions={null}>
        <Sublevels />
      </AdminPageLayout>
    </PrivateRoute>
  );
}

function SubjectsRoute() {
  const navigate = useNavigate();
  const handleNavigate = (key) => {
    const path = ROUTE_MAP[key];
    if (path) navigate(path);
  };

  return (
    <PrivateRoute>
      <AdminPageLayout activeKey="subjects" onNavigate={handleNavigate} permissions={null}>
        <Subjects />
      </AdminPageLayout>
    </PrivateRoute>
  );
}

function FacilitiesRoute() {
  const navigate = useNavigate();
  const handleNavigate = (key) => {
    const path = ROUTE_MAP[key];
    if (path) navigate(path);
  };

  return (
    <PrivateRoute>
      <AdminPageLayout activeKey="facilities" onNavigate={handleNavigate} permissions={null}>
        <SchoolFacility />
      </AdminPageLayout>
    </PrivateRoute>
  );
}

function StudentsRoute() {
  const navigate = useNavigate();
  const handleNavigate = (key) => {
    const path = ROUTE_MAP[key];
    if (path) navigate(path);
  };

  return (
    <PrivateRoute>
      <AdminPageLayout activeKey="student-management" onNavigate={handleNavigate} permissions={null}>
        <Students />
      </AdminPageLayout>
    </PrivateRoute>
  );
}

function EnrollmentsRoute() {
  const navigate = useNavigate();
  const handleNavigate = (key) => {
    const path = ROUTE_MAP[key];
    if (path) navigate(path);
  };

  return (
    <PrivateRoute>
      <AdminPageLayout activeKey="enrollments" onNavigate={handleNavigate} permissions={null}>
        <Enrollments />
      </AdminPageLayout>
    </PrivateRoute>
  );
}

function RegisterStudentRoute() {
  const navigate = useNavigate();
  const handleNavigate = (key) => {
    const path = ROUTE_MAP[key];
    if (path) navigate(path);
  };

  return (
    <PrivateRoute>
      <AdminPageLayout activeKey="register-student" onNavigate={handleNavigate} permissions={null}>
        <RegisterStudent />
      </AdminPageLayout>
    </PrivateRoute>
  );
}

function AddEnrollmentRoute() {
  const navigate = useNavigate();
  const handleNavigate = (key) => {
    const path = ROUTE_MAP[key];
    if (path) navigate(path);
  };

  return (
    <PrivateRoute>
      <AdminPageLayout activeKey="add-enrollment" onNavigate={handleNavigate} permissions={null}>
        <AddEnrollment />
      </AdminPageLayout>
    </PrivateRoute>
  );
}

function AppContent() {
  const location = useLocation();
  const isAdminRoute = ADMIN_ROUTES.some((r) => location.pathname.startsWith(r));

  return (
    <>
      {!isAdminRoute && <Header />}

      <Routes>
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
<Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/About" element={<About />} />

        <Route path="/users" element={<UsersRoute />} />
        <Route path="/schools" element={<SchoolsRoute />} />
        <Route path="/roles" element={<RolesRoute />} />
        <Route path="/permissions" element={<PermissionsRoute />} />
        <Route path="/zones" element={<ZonesRoute />} />
        <Route path="/lgas" element={<LgasRoute />} />
        <Route path="/academic-years" element={<AcademicYearsRoute />} />
        <Route path="/terms" element={<TermsRoute />} />
        <Route path="/levels" element={<LevelsRoute />} />
        <Route path="/sublevels" element={<SublevelsRoute />} />
        <Route path="/subjects" element={<SubjectsRoute />} />
        <Route path="/facilities" element={<FacilitiesRoute />} />
        <Route path="/students" element={<StudentsRoute />} />
        <Route path="/register-student" element={<RegisterStudentRoute />} />
        <Route path="/enrollments" element={<EnrollmentsRoute />} />
        <Route path="/add-enrollment" element={<AddEnrollmentRoute />} />
        <Route path="/admindashboard" element={<AdminDashboardRoute />} />
      </Routes>

      {!isAdminRoute && <Footer />}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
