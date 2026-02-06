import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
});

// TODO: Add JWT token to requests interceptor
// TODO: Add error handling interceptor

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
