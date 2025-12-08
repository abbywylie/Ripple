import axios from 'axios';

// API Client Configuration

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

// Export apiClient as 'api' for direct use
export const api = apiClient;
export default apiClient;

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await axios.post(`${API_BASE_URL}/api/login`, { email, password });
    return response.data;
  },
  register: async (name: string, email: string, password: string, company_or_school?: string, role?: string) => {
    const response = await axios.post(`${API_BASE_URL}/api/register`, { name, email, password, company_or_school, role });
    return response.data;
  },
  getMe: async () => {
    const response = await apiClient.get('/api/me');
    return response.data;
  },
  updateProfile: async (data: { name?: string; company_or_school?: string; role?: string; experience_level?: string; onboarding_completed?: boolean }) => {
    const response = await apiClient.put('/api/me', data);
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
  updateContact: async (contactId: number, data: any) => {
    const response = await apiClient.put(`/contacts/${contactId}`, data);
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
  getMeetingsForContact: async (contactId: number) => {
    // Alias for getContactMeetings for backwards compatibility
    const response = await apiClient.get(`/contacts/${contactId}/meetings`);
    return response.data;
  },
  createMeeting: async (data: any) => {
    const response = await apiClient.post('/meetings', data);
    return response.data;
  },
  updateMeeting: async (meetingId: number, meetingData: any) => {
    const response = await apiClient.put('/meetings', { meeting_id: meetingId, ...meetingData });
    return response.data;
  },
  deleteMeeting: async (meetingId: number, userId?: number) => {
    // Support both signatures: deleteMeeting(meetingId) and deleteMeeting(meetingId, userId)
    const response = await apiClient.delete('/meetings', {
      data: { meeting_id: meetingId, user_id: userId },
    });
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
  parseEmail: async (emailText: string) => {
    const response = await apiClient.post('/api/parse-email', { email_text: emailText });
    return response.data;
  },
  logEmail: async (emailData: any) => {
    const response = await apiClient.post('/api/log-email', emailData);
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

// Stats API (public endpoint)
export const statsApi = {
  getStats: async () => {
    const response = await axios.get(`${API_BASE_URL}/api/stats`);
    return response.data;
  },
};

// Public Profiles API
export const publicProfilesApi = {
  createOrUpdate: async (data: {
    display_name: string;
    school?: string;
    role?: string;
    industry_tags?: string[];
    contact_method?: string;
    contact_info?: string;
    visibility?: boolean;
  }) => {
    const response = await apiClient.post('/public-profiles', data);
    return response.data;
  },
  getAll: async (params?: { industry?: string; school?: string; role?: string }) => {
    const response = await apiClient.get('/public-profiles', { params });
    return response.data;
  },
  getByUserId: async (userId: number) => {
    const response = await apiClient.get(`/public-profiles/${userId}`);
    return response.data;
  },
  delete: async (userId: number) => {
    const response = await apiClient.delete(`/public-profiles/${userId}`);
    return response.data;
  },
};

// Recommendations API
export const recommendationsApi = {
  getRecommendations: async (params?: { threshold?: number; use_ml?: boolean }) => {
    const response = await apiClient.get('/api/recommendations', { params });
    return response.data;
  },
};

// Gmail Plugin API
export const gmailApi = {
  getContacts: async () => {
    const response = await apiClient.get('/api/gmail/contacts');
    return response.data;
  },
  getThreads: async (contactEmail?: string) => {
    const params = contactEmail ? { contact_email: contactEmail } : {};
    const response = await apiClient.get('/api/gmail/threads', { params });
    return response.data;
  },
  getThreadMessages: async (threadId: string) => {
    const response = await apiClient.get(`/api/gmail/threads/${threadId}/messages`);
    return response.data;
  },
  getSyncStatus: async () => {
    const response = await apiClient.get('/api/gmail/sync-status');
    return response.data;
  },
  getOAuthUrl: async () => {
    const response = await apiClient.get('/api/gmail/oauth/authorize');
    return response.data;
  },
  triggerSync: async () => {
    const response = await apiClient.post('/api/gmail/sync');
    return response.data;
  },
};

