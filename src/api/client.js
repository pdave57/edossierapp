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

// Token refresh state
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor to handle 401 with automatic token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Helper: clear auth state and redirect to login
    const clearAuthAndRedirect = () => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      delete api.defaults.headers.common['Authorization'];
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    };

    // Only attempt refresh on 401, and only for non-public, non-refresh endpoints
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      PUBLIC_AUTH_PATHS.some((path) => originalRequest.url?.endsWith('/api/v1/auth/refresh'))
    ) {
      // If it's a non-retried 401 on a protected route (not refresh endpoint),
      // it means the token is gone/invalid — clear auth state
      if (error.response?.status === 401 && !originalRequest._retry) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        delete api.defaults.headers.common['Authorization'];
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    isRefreshing = true;

    try {
      const refreshToken = localStorage.getItem('refresh_token');
      const refreshPayload = refreshToken ? { refresh_token: refreshToken } : {};
      const response = await api.post('/api/v1/auth/refresh', refreshPayload);
      const authData = response.data?.data || response.data;
      const { access_token, refresh_token } = authData;

      if (access_token) {
        localStorage.setItem('access_token', access_token);
      }
      if (refresh_token) {
        localStorage.setItem('refresh_token', refresh_token);
      }

      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      originalRequest.headers.Authorization = `Bearer ${access_token}`;

      processQueue(null, access_token);
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearAuthAndRedirect();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
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
export const changePassword = (data) => api.post('/api/v1/auth/change-password', data);

// --- Users ---
export const getUsers = () => api.get('/api/v1/users');
export const getUser = (id) => api.get(`/api/v1/users/${id}`);
export const updateUser = (id, data) => api.put(`/api/v1/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/api/v1/users/${id}`);
export const assignUserRole = (id, data) => api.post(`/api/v1/users/${id}/roles`, data);
export const revokeUserRole = (id, roleId) => api.delete(`/api/v1/users/${id}/roles/${roleId}`);

// --- Roles ---
export const getRoles = () => api.get('/api/v1/roles');
export const createRole = (data) => api.post('/api/v1/roles', data);
export const getRole = (id) => api.get(`/api/v1/roles/${id}`);
export const updateRole = (id, data) => api.put(`/api/v1/roles/${id}`, data);
export const deleteRole = (id) => api.delete(`/api/v1/roles/${id}`);


// --- Sessions ---
export const getSessions = (page = 1, limit = 10, schoolId = null) =>
  api.get('/api/v1/sessions', { params: schoolId ? { page, limit, school_id: schoolId } : { page, limit } });
export const getActiveSession = () => api.get('/api/v1/sessions/active');
export const getSession = (id) => api.get(`/api/v1/sessions/${id}`);
export const createSession = (data, schoolId = null) =>
  api.post('/api/v1/sessions', data, schoolId ? { params: { school_id: schoolId } } : undefined);
export const updateSession = (id, data) => api.put(`/api/v1/sessions/${id}`, data);
export const activateSession = (id, schoolId = null) =>
  api.post(`/api/v1/sessions/${id}/activate`, {}, schoolId ? { params: { school_id: schoolId } } : undefined);
export const deleteSession = (id) => api.delete(`/api/v1/sessions/${id}`);

// --- Terms ---
export const getTerms = () => api.get('/api/v1/terms');
export const createTerm = (data) => api.post('/api/v1/terms', data);
export const getTerm = (id) => api.get(`/api/v1/terms/${id}`);
export const updateTerm = (id, data) => api.put(`/api/v1/terms/${id}`, data);
export const deleteTerm = (id) => api.delete(`/api/v1/terms/${id}`);

// --- Session Terms ---
export const getSessionTerms = (sessionId) => api.get(`/api/v1/sessions/${sessionId}/terms`);
export const createSessionTerm = (sessionId, data) => api.post(`/api/v1/sessions/${sessionId}/terms`, data);
export const updateSessionTerm = (sessionId, id, data) => api.put(`/api/v1/sessions/${sessionId}/terms/${id}`, data);
export const activateSessionTerm = (sessionId, id) => api.post(`/api/v1/sessions/${sessionId}/terms/${id}/activate`, {});
export const deleteSessionTerm = (sessionId, id) => api.delete(`/api/v1/sessions/${sessionId}/terms/${id}`);

// --- Levels ---
export const getLevels = (page = 1, limit = 10, schoolId) => api.get('/api/v1/levels', { params: { page, limit, ...(schoolId ? { school_id: schoolId } : {}) } });
export const createLevel = (data, schoolId = null) =>
  api.post('/api/v1/levels', data, schoolId ? { params: { school_id: schoolId } } : undefined);
export const getLevel = (id) => api.get(`/api/v1/levels/${id}`);
export const updateLevel = (id, data) => api.put(`/api/v1/levels/${id}`, data);
export const deleteLevel = (id) => api.delete(`/api/v1/levels/${id}`);
export const getLevelSubLevels = (levelId) => api.get(`/api/v1/levels/${levelId}/sub-levels`);

// --- Sublevels ---
export const getSublevels = () => api.get('/api/v1/sublevels');
export const createSublevel = (schoolId, levelId, data) => {
  const params = new URLSearchParams();
  if (schoolId) params.set('school_id', schoolId);
  if (levelId) params.set('level_id', levelId);
  const qs = params.toString();
  return api.post(`/api/v1/sub-levels${qs ? `?${qs}` : ''}`, data);
};
export const getSublevel = (id) => api.get(`/api/v1/sub-levels/${id}`);
export const updateSublevel = (id, data) => api.put(`/api/v1/sub-levels/${id}`, data);
export const deleteSublevel = (id) => api.delete(`/api/v1/sub-levels/${id}`);
export const getSchoolSubLevels = (schoolId) => api.get(`/api/v1/schools/${schoolId}/sub-levels`);
export const createSchoolSubLevel = (schoolId, data) => api.post(`/api/v1/schools/${schoolId}/sub-levels`, data);

// --- Subjects ---
export const getSubjects = (page = 1, limit = 10) => api.get('/api/v1/subjects', { params: { page, limit } });
export const createSubject = (data) => api.post('/api/v1/subjects', data);
export const getSubject = (id) => api.get(`/api/v1/subjects/${id}`);
export const updateSubject = (id, data) => api.put(`/api/v1/subjects/${id}`, data);
export const deleteSubject = (id) => api.delete(`/api/v1/subjects/${id}`);

// --- Permissions ---
export const getPermissions = () => api.get('/api/v1/permissions');
export const addPermissionToRole = (roleId, permissionId) => api.post(`/api/v1/roles/${roleId}/permissions`, { permission_id: permissionId });
export const removePermissionFromRole = (roleId, permissionId) => api.delete(`/api/v1/roles/${roleId}/permissions/${permissionId}`);

// --- Lgas ---
export const getLgas = () => api.get('/api/v1/lgas');
export const getStatelgas = (id) => api.get(`/api/v1/states/${id}/lgas`);
export const getLga = (id) => api.get(`/api/v1/lgas/${id}`);
export const createLga = (stateId, data) => api.post(`/api/v1/states/${stateId}/lgas`, data);
export const updateLga = (id, data) => api.put(`/api/v1/lgas/${id}`, data);
export const deleteLga = (id) => api.delete(`/api/v1/lgas/${id}`);

// --- States ---
export const getStates = () => api.get('/api/v1/states');
export const createState = (data) => api.post('/api/v1/states', data);
export const updateState = (id, data) => api.put(`/api/v1/states/${id}`, data);
export const deleteState = (id) => api.delete(`/api/v1/states/${id}`);

// --- Zones ---
export const getZones = () => api.get('/api/v1/zones');
export const getStateZones = (id) => api.get(`/api/v1/states/${id}/zones`);
export const getZone = (id) => api.get(`/api/v1/zones/${id}`);
export const createStateZone = (stateId, data) => api.post(`/api/v1/states/${stateId}/zones`, data);
export const updateZone = (id, data) => api.put(`/api/v1/zones/${id}`, data);
export const deleteZone = (id) => api.delete(`/api/v1/zones/${id}`);

// --- Schools ---
export const getSchools = () => api.get('/api/v1/schools');
export const createSchool = (data) => api.post('/api/v1/schools', data);
export const getSchool = (id) => api.get(`/api/v1/schools/${id}`);
export const updateSchool = (id, data) => api.put(`/api/v1/schools/${id}`, data);
export const deleteSchool = (id) => api.delete(`/api/v1/schools/${id}`);

// --- School Facilities ---
export const listFacilities = (schoolId) => api.get(`/api/v1/schools/${schoolId}/facilities`);
export const createFacility = (schoolId, data) => api.post(`/api/v1/schools/${schoolId}/facilities`, data);
export const updateFacility = (schoolId, facilityId, data) => api.put(`/api/v1/schools/${schoolId}/facilities/${facilityId}`, data);
export const deleteFacility = (schoolId, facilityId) => api.delete(`/api/v1/schools/${schoolId}/facilities/${facilityId}`);

// --- Reports ---
export const getTPTotal = () => api.get('/api/v1/reports/public/teaching-personnel');
export const getGenderTotal = () => api.get('/api/v1/reports/gender/total');
export const getTotalStudents = () => api.get('/api/v1/reports/students/total');
export const getTotalPersonnel = () => api.get('/api/v1/reports/personnel/total');
export const getTotalSchools = () => api.get('/api/v1/reports/schools/total');

// --- Dashboard ---
export const getDashboardStats = () => api.get('/api/v1/dashboard/stats');

// --- Personnel ---
export const getPersonnel = (page = 1, limit = 10, params = {}) => api.get('/api/v1/personnel', { params: { page, limit, ...params } });
export const getPersonnelById = (id) => api.get(`/api/v1/personnel/${id}`);
export const updatePersonnel = (id, data) => api.put(`/api/v1/personnel/${id}`, data);
export const deletePersonnel = (id) => api.delete(`/api/v1/personnel/${id}`);
export const transferPersonnel = (id, data) => api.post(`/api/v1/personnel/${id}/transfer`, data);
export const getPersonnelTransfers = (id) => api.get(`/api/v1/personnel/${id}/transfers`);

// --- Students ---
export const getStudents = (page = 1, limit = 10, params = {}) => api.get('/api/v1/students', { params: { page, limit, ...params } });
export const createStudent = (data) => api.post('/api/v1/students', data);
export const getStudent = (id) => api.get(`/api/v1/students/${id}`);
export const updateStudent = (id, data) => api.put(`/api/v1/students/${id}`, data);
export const deleteStudent = (id) => api.delete(`/api/v1/students/${id}`);
export const getNextStudentSerial = (schoolId, year) => api.get('/api/v1/students/next-serial', { params: { school_id: schoolId, year } });

// --- Enrollments ---
export const getEnrollments = (page = 1, limit = 10, params = {}) => api.get('/api/v1/enrollments', { params: { page, limit, ...params } });
export const enrollStudent = (data) => api.post('/api/v1/enrollments', data);
export const updateEnrollment = (id, data) => api.put(`/api/v1/enrollments/${id}`, data);

// --- Results & Scores ---
export const upsertScore = (data) => api.post('/api/v1/results/scores', data);
export const bulkUpsertScores = (data) => api.post('/api/v1/results/scores/bulk', data);
export const computePositions = (data) => api.post('/api/v1/results/scores/compute-positions', data);
export const getStudentScores = (studentId, params = {}) => api.get(`/api/v1/students/${studentId}/scores`, { params });

// --- Report Cards ---
export const getReportCards = (page = 1, limit = 10, params = {}) => api.get('/api/v1/results/report-cards', { params: { page, limit, ...params } });
export const generateReportCards = (data) => api.post('/api/v1/results/report-cards/generate', data);
export const getReportCard = (id) => api.get(`/api/v1/results/report-cards/${id}`);
export const getStudentAllReportCards = (studentId) => api.get(`/api/v1/students/${studentId}/report-cards`);
export const getStudentCurrentReportCard = (studentId) => api.get(`/api/v1/students/${studentId}/report-card`);
export const updateReportCardRemarks = (id, data) => api.put(`/api/v1/results/report-cards/${id}/remarks`, data);
export const publishReportCard = (id) => api.post(`/api/v1/results/report-cards/${id}/publish`, {});

// --- Score & Grade Configuration ---
export const upsertScoreConfig = (data) => api.post('/api/v1/results/score-config', data);
export const upsertGradeConfig = (data) => api.post('/api/v1/results/grade-config', data);
export const getGradeConfigs = () => api.get('/api/v1/results/grade-config');

// --- Avatars ---
export const uploadPersonnelAvatar = (id, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.put(`/api/v1/avatar/personnel/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
export const uploadStudentAvatar = (id, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.put(`/api/v1/avatar/students/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// Extract a human-readable error message from an axios error.
// Backend error shape: { success: false, error: { code, message, details } }
export const getErrorMessage = (err, fallback = 'Unknown error') => {
  const data = err?.response?.data;
  if (!data) return err?.message || fallback;

  const errorObj = data.error;
  if (errorObj && typeof errorObj === 'object') {
    if (typeof errorObj.message === 'string' && errorObj.message) return errorObj.message;
    if (errorObj.details && typeof errorObj.details === 'object') {
      const parts = Object.entries(errorObj.details).map(([field, value]) =>
        `${field}: ${Array.isArray(value) ? value.join(', ') : String(value)}`
      );
      if (parts.length) return parts.join('; ');
    }
  }

  if (typeof data.message === 'string' && data.message) return data.message;
  if (typeof err?.message === 'string') return err.message;
  return fallback;
};

export default api;
