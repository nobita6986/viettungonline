import apiClient from '@/lib/apiClient';
export const getMonthlyReportData = async (month: string) => (await apiClient.get(`/reports/monthly?month=${month}`)).data;