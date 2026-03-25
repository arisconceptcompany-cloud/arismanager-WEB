import axios from 'axios';

const API_URL = '';
const JAVA_API = '';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = async (email, password) => {
  const response = await api.post('/api/login', { email, password });
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('email', email);
    localStorage.setItem('isLoggedIn', 'true');
  }
  return response.data;
};

export const register = async (userData) => {
  const response = await api.post('/api/register', userData);
  return response.data;
};

export const verifyCode = async (email, code) => {
  const response = await api.post('/api/verify', { email, code });
  return response.data;
};

export const getPostes = async () => {
  const response = await api.get('/api/postes');
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('username');
  localStorage.removeItem('token');
};

export const isAuthenticated = () => {
  return localStorage.getItem('isLoggedIn') === 'true';
};

export const getEmployes = async () => {
  try {
    const response = await axios.get(`/api/employe/all`);
    return response.data;
  } catch (error) {
    console.error('Error fetching employees:', error);
    return [];
  }
};

export const getEmploye = async (id) => {
  try {
    const response = await axios.get(`/api/employe/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching employee:', error);
    return null;
  }
};

export const updateEmploye = async (id, data) => {
  try {
    const response = await api.put(`/api/employes/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating employee:', error);
    throw error;
  }
};

export const deleteEmploye = async (id) => {
  try {
    const response = await api.delete(`/api/employes/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting employee:', error);
    throw error;
  }
};

export const createEmploye = async (data) => {
  try {
    const response = await api.post(`/api/employes`, data);
    return response.data;
  } catch (error) {
    console.error('Error creating employee:', error);
    throw error;
  }
};

export const changeEmployePassword = async (token, currentPassword, newPassword) => {
  try {
    const response = await api.post(`/api/employe/change-password`, {
      token,
      currentPassword,
      newPassword
    });
    return response.data;
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
};

export const changeAdminPassword = async (userId, currentPassword, newPassword) => {
  try {
    const response = await api.post(`/api/admin/change-password`, {
      userId,
      currentPassword,
      newPassword
    });
    return response.data;
  } catch (error) {
    console.error('Error changing admin password:', error);
    throw error;
  }
};

export const getPostesJava = async () => {
  try {
    const response = await api.get(`/postes`);
    return response.data;
  } catch (error) {
    console.error('Error fetching postes:', error);
    return [];
  }
};

export const getPresenceStats = async () => {
  try {
    const response = await api.get(`/api/dashboard/stats`);
    return response.data;
  } catch (error) {
    console.error('Error fetching presence stats:', error);
    return { totalEmployees: 0, presentToday: 0, absentToday: 0, lastScan: null };
  }
};

export const getStatsByDate = async (date) => {
  try {
    const response = await api.get(`/api/stats/${date}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching stats by date:', error);
    return { totalEmployees: 0, presentToday: 0, absentToday: 0 };
  }
};

export const getTodayPresences = async () => {
  try {
    const response = await api.get(`/api/dashboard/presences`);
    return response.data;
  } catch (error) {
    console.error('Error fetching presences:', error);
    return [];
  }
};

export const getPresencesByDate = async (date) => {
  try {
    const response = await api.get(`/api/presences/${date}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching presences by date:', error);
    return [];
  }
};

export const getAllEmployes = async () => {
  try {
    const response = await axios.get(`/api/employees-status`);
    return response.data;
  } catch (error) {
    console.error('Error fetching all employes:', error);
    return [];
  }
};

export default api;

export const getConges = async () => {
  try {
    const response = await axios.get(`/api/conges`);
    return response.data;
  } catch (error) {
    console.error('Error fetching conges:', error);
    return [];
  }
};

export const getCongesPending = async () => {
  try {
    const response = await axios.get(`/api/conges/pending`);
    return response.data;
  } catch (error) {
    console.error('Error fetching pending conges:', error);
    return [];
  }
};

export const approveConge = async (id) => {
  const response = await axios.patch(`/api/conges/${id}/approve`);
  return response.data;
};

export const rejectConge = async (id) => {
  const response = await axios.patch(`/api/conges/${id}/reject`);
  return response.data;
};

export const createConge = async (congeData) => {
  const response = await axios.post(`/api/conges`, congeData);
  return response.data;
};

export const deleteConge = async (id) => {
  const response = await axios.delete(`/api/conges/${id}`);
  return response.data;
};

export const getCongeTypes = async () => {
  try {
    const response = await axios.get(`/api/conges/types`);
    return response.data;
  } catch (error) {
    console.error('Error fetching conge types:', error);
    return [];
  }
};

export const getCongesActifs = async () => {
  try {
    const response = await axios.get(`/api/conges/actifs`);
    return response.data;
  } catch (error) {
    console.error('Error fetching actifs conges:', error);
    return [];
  }
};

export const getSalaries = async (mois, annee) => {
  try {
    const params = mois && annee ? `?mois=${mois}&annee=${annee}` : '';
    const response = await axios.get(`/api/salaries${params}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching salaries:', error);
    return [];
  }
};

export const calculateSalary = async (employeeId, mois, annee) => {
  const response = await axios.post(`/api/salaries/calculate`, {
    employee_id: employeeId,
    mois,
    annee
  });
  return response.data;
};

export const updateSalary = async (id, data) => {
  const response = await axios.patch(`/api/salaries/${id}`, data);
  return response.data;
};

export const generateMonthlySalaries = async (mois, annee) => {
  const response = await axios.post(`/api/salaries/generate-month`, {
    mois,
    annee
  });
  return response.data;
};

export const getDashboardStats = async () => {
  try {
    const response = await axios.get(`/api/dashboard/stats`);
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return { totalEmployees: 0, presentToday: 0, absentToday: 0 };
  }
};

export const getSalariesSummary = async () => {
  try {
    const response = await axios.get(`/api/salaries`);
    return response.data;
  } catch (error) {
    console.error('Error fetching salaries summary:', error);
    return [];
  }
};

export const getProjets = async () => {
  try {
    const response = await axios.get(`/api/projets`);
    return response.data;
  } catch (error) {
    console.error('Error fetching projets:', error);
    return [];
  }
};

export const createProjet = async (projetData) => {
  const response = await axios.post(`/api/projets`, projetData);
  return response.data;
};

export const updateProjet = async (id, projetData) => {
  const response = await axios.put(`/api/projets/${id}`, projetData);
  return response.data;
};

export const deleteProjet = async (id) => {
  const response = await axios.delete(`/api/projets/${id}`);
  return response.data;
};

export const uploadEmployeePhoto = async (employeeId, photoFile) => {
  const formData = new FormData();
  formData.append('photo', photoFile);
  const response = await api.post(`/api/employe/${employeeId}/photo`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getBadgeQR = async (badgeId) => {
  try {
    const response = await axios.get(`/badge/${encodeURIComponent(badgeId)}/qr`);
    return response.data;
  } catch (error) {
    console.error('Error fetching badge QR:', error);
    return null;
  }
};

export const downloadBadgePdf = async (badgeId) => {
  try {
    const response = await axios.get(`/badge/${encodeURIComponent(badgeId)}/badge.pdf`, {
      responseType: 'arraybuffer'
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `badge-${badgeId}.pdf`);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 100);
    return true;
  } catch (error) {
    console.error('Error downloading badge PDF:', error);
    alert('Erreur lors du téléchargement du PDF: ' + (error.message || 'Erreur inconnue'));
    return false;
  }
};

export const getBadgeExemple = async () => {
  try {
    const response = await axios.get(`/badge-exemple`);
    return response.data;
  } catch (error) {
    console.error('Error fetching badge exemple:', error);
    return null;
  }
};

export const uploadProjetFile = async (projetId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post(`/api/projets/${projetId}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getProjetFiles = async (projetId) => {
  try {
    const response = await axios.get(`/api/projets/${projetId}/files`);
    return response.data;
  } catch (error) {
    console.error('Error fetching projet files:', error);
    return [];
  }
};

export const downloadProjetFile = async (projetId, fileId, fileName) => {
  try {
    const response = await axios.get(`/api/projets/${projetId}/download/${fileId}`, {
      responseType: 'arraybuffer',
    });
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 100);
    return true;
  } catch (error) {
    console.error('Error downloading file:', error);
    alert('Erreur lors du téléchargement: ' + (error.message || 'Erreur inconnue'));
    return false;
  }
};

export const deleteProjetFile = async (projetId, fileId) => {
  const response = await axios.delete(`/api/projets/${projetId}/files/${fileId}`);
  return response.data;
};
