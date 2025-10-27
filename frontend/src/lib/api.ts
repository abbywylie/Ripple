import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Configure axios
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && token !== 'mock_token_for_ripple') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await axios.post(`${API_BASE_URL}/api/login`, { email, password });
    return response.data;
  },
  register: async (name: string, email: string, password: string) => {
    const response = await axios.post(`${API_BASE_URL}/api/register`, { name, email, password });
    return response.data;
  },
  getMe: async () => {
    const response = await apiClient.get('/api/me');
    return response.data;
  },
};

// Contacts API
export const contactsApi = {
  getContacts: async (userId: number) => {
    const response = await apiClient.get(`/users/${userId}/contacts`);
    return response.data;
  },
  createContact: async (data: any) => {
    const response = await apiClient.post('/contacts', data);
    return response.data;
  },
  updateContact: async (data: any) => {
    const response = await apiClient.put('/contacts', data);
    return response.data;
  },
  deleteContact: async (data: any) => {
    const response = await apiClient.delete('/contacts', { data });
    return response.data;
  },
};

// Goals API
export const goalsApi = {
  getGoals: async (userId: number) => {
    const response = await apiClient.get(`/users/${userId}/goals`);
    return response.data;
  },
  createGoal: async (data: any) => {
    const response = await apiClient.post('/goals', data);
    return response.data;
  },
  updateGoal: async (data: any) => {
    const response = await apiClient.put('/goals', data);
    return response.data;
  },
  deleteGoal: async (data: any) => {
    const response = await apiClient.delete('/goals', { data });
    return response.data;
  },
  getGoalSteps: async (goalId: number) => {
    const response = await apiClient.get(`/goals/${goalId}/steps`);
    return response.data;
  },
  createGoalStep: async (data: any) => {
    const response = await apiClient.post('/goal-steps', data);
    return response.data;
  },
  updateGoalStep: async (data: any) => {
    const response = await apiClient.put('/goal-steps', data);
    return response.data;
  },
  deleteGoalStep: async (data: any) => {
    const response = await apiClient.delete('/goal-steps', { data });
    return response.data;
  },
};

// Meetings API
export const meetingsApi = {
  getUserMeetings: async (userId: number) => {
    const response = await apiClient.get(`/users/${userId}/meetings`);
    return response.data;
  },
  getContactMeetings: async (contactId: number) => {
    const response = await apiClient.get(`/contacts/${contactId}/meetings`);
    return response.data;
  },
  createMeeting: async (data: any) => {
    const response = await apiClient.post('/meetings', data);
    return response.data;
  },
};

// Interactions API
export const interactionsApi = {
  getInteractionsForContact: async (contactId: number, userId: number) => {
    const response = await apiClient.get(`/contacts/${contactId}/interactions?user_id=${userId}`);
    return response.data;
  },
  getInteractionsForUser: async (userId: number) => {
    const response = await apiClient.get(`/users/${userId}/interactions`);
    return response.data;
  },
  createInteraction: async (data: any) => {
    const response = await apiClient.post('/interactions', data);
    return response.data;
  },
  updateInteraction: async (data: any) => {
    const response = await apiClient.put('/interactions', data);
    return response.data;
  },
  deleteInteraction: async (data: any) => {
    const response = await apiClient.delete('/interactions', { data });
    return response.data;
  },
};

// Follow-ups API
export const followUpsApi = {
  getUpcomingFollowUps: async (userId: number, days: number = 7) => {
    const response = await apiClient.get(`/users/${userId}/follow-ups?days=${days}`);
    return response.data;
  },
  getOverdueFollowUps: async (userId: number) => {
    const response = await apiClient.get(`/users/${userId}/overdue-follow-ups`);
    return response.data;
  },
  getUpcomingInteractionFollowUps: async (userId: number, days: number = 7) => {
    const response = await apiClient.get(`/users/${userId}/upcoming-interaction-follow-ups?days=${days}`);
    return response.data;
  },
};

