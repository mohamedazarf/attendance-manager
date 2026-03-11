const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/v1/auth/login`,
    REGISTER: `${API_BASE_URL}/api/v1/auth/register`,
  },
  ROLES: {
    ME: `${API_BASE_URL}/api/v1/roles/me`,
  },
  EMPLOYEES: {
    LIST: `${API_BASE_URL}/api/v1/employee/all`,
    INACTIVE: `${API_BASE_URL}/api/v1/employee/inactive`,
    ADD: `${API_BASE_URL}/api/v1/employee/add`,
    DELETE: (id: string) => `${API_BASE_URL}/api/v1/employee/${id}`,
  },
  ATTENDANCE: {
    DASHBOARD_DEPARTMENTS: `${API_BASE_URL}/api/v1/attendance/dashboard/departments`,
    RAPPORT: `${API_BASE_URL}/api/v1/attendance/rapport`,
  },
  // Add other endpoints as needed
};

export default API_BASE_URL;
