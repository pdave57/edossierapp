import axios from 'axios';

const API_BASE_URL = 'http://localhost:34005';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const PUBLIC_AUTH_PATHS = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/refresh',
];

// Request interceptor to attach JWT token to protected routes
api.interceptors.request.use(
  (config) => {
    const requestPath = config.url || '';
    const isPublicAuthRequest = PUBLIC_AUTH_PATHS.some((path) => requestPath.endsWith(path));

    if (isPublicAuthRequest) {
      delete config.headers.Authorization;
      return config;
    }

    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      // Optional: window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// --- Health ---
export const checkHealth = () => api.get('/health');

// --- Auth ---
export const registerUser = (data) => api.post('/api/v1/auth/register', data);
export const loginUser = ({ email, password }) => api.post('/api/v1/auth/login', {
  email: email.trim(),
  password,
});
export const refreshToken = () => api.post('/api/v1/auth/refresh');
export const getMe = () => api.get('/api/v1/auth/me');
export const logoutUser = () => api.post('/api/v1/auth/logout');

// --- Users ---
export const getUsers = () => api.get('/api/v1/users/');
export const getUser = (id) => api.get(`/api/v1/users/${id}`);
export const updateUser = (id, data) => api.put(`/api/v1/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/api/v1/users/${id}`);
export const assignUserRole = (id, data) => api.post(`/api/v1/users/${id}/roles`, data);
export const revokeUserRole = (id, roleId) => api.delete(`/api/v1/users/${id}/roles/${roleId}`);

// --- Roles ---
export const getRoles = () => api.get('/api/v1/roles/');
export const createRole = (data) => api.post('/api/v1/roles/', data);
export const getRole = (id) => api.get(`/api/v1/roles/${id}`);
export const updateRole = (id, data) => api.put(`/api/v1/roles/${id}`, data);
export const deleteRole = (id) => api.delete(`/api/v1/roles/${id}`);

// --- Lgas ---
export const getLgas = () => api.get("/api/v1/lgas/");
export const createLga = (data) => api.post("/api/v1/lgas/", data);
export const updateLga = (id, data) => api.put(`/api/v1/lgas/${id}`, data);
export const deleteLga = (id) => api.delete(`/api/v1/lgas/${id}`);

// --- States ---
export const getStates = () => api.get("/api/v1/states/");
export const createState = (data) => api.post("/api/v1/states/", data);
export const updateState = (id, data) => api.put(`/api/v1/states/${id}`, data);
export const deleteState = (id) => api.delete(`/api/v1/states/${id}`);

// --- Zones ---
export const getZones = () => api.get("/api/v1/zones/");
export const createZone = (data) => api.post("/api/v1/zones/", data);
export const updateZone = (id, data) => api.put(`/api/v1/zones/${id}`, data);
export const deleteZone = (id) => api.delete(`/api/v1/zones/${id}`);
 
// --- Schools ---
export const getSchools = () => api.get('/api/v1/schools/');
export const createSchool = (data) => api.post('/api/v1/schools/', data);
export const getSchool = (id) => api.get(`/api/v1/schools/${id}`);
export const updateSchool = (id, data) => api.put(`/api/v1/schools/${id}`, data);
export const deleteSchool = (id) => api.delete(`/api/v1/schools/${id}`);

// --- Reports ---
export const getTPTotal = () => api.get('/api/v1/reports/public/teaching-personnel');
export const getGenderTotal = () => api.get('/api/v1/reports/gender/total');
export const getTotalStudents = () => api.get('/api/v1/reports/students/total');
export const getTotalPersonnel = () => api.get('/api/v1/reports/personnel/total');
export const getTotalSchools = () => api.get('/api/v1/reports/schools/total');

// --- Dashboard ---
export const getDashboardStats = () => api.get('/api/v1/dashboard/stats');

export default api;
