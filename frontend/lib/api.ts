import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Optional: Redirect to login or clear token if 401
      // localStorage.removeItem('token');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

interface ScheduleEmailParams {
  to: string;
  subject: string;
  body: string;
  html?: string;
  scheduledAt: string;
}

export async function scheduleEmail(params: ScheduleEmailParams): Promise<{ success: boolean; jobId: string }> {
  const response = await apiClient.post('/email/schedule', params);
  return response.data;
}

interface GetEmailsParams {
  page?: number;
  limit?: number;
}

export async function getEmails(params: GetEmailsParams = {}): Promise<{
  emails: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}> {
  const response = await apiClient.get('/email', { params });
  return response.data;
}

export async function getQueueStats(): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}> {
  const response = await apiClient.get('/email/stats');
  return response.data;
}

export async function getJobStatus(jobId: string): Promise<{
  id: string;
  state: string;
  progress: number;
  data: unknown;
}> {
  const response = await apiClient.get(`/email/job/${jobId}`);
  return response.data;
}

export async function checkHealth(): Promise<{ status: string; service: string }> {
  const response = await apiClient.get('/auth/health');
  return response.data;
}

export default apiClient;
