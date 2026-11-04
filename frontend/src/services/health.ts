import { apiClient } from './api';
import { HealthResponse } from '../types';

export const fetchBackendHealth = async (): Promise<HealthResponse> => {
  const response = await apiClient.get<HealthResponse>('/api/v1/health/');
  return response.data;
};
