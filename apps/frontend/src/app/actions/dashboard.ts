import apiClient from '@/lib/apiClient';
export interface ChartDataPoint { name: string; value: number; }
export interface DashboardSummary { total: number; }
export const getDashboardSummary = async () => (await apiClient.get('/dashboard/summary')).data;