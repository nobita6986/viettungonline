import apiClient from '@/lib/apiClient';
export const createCommissionRule = async (data: any) => (await apiClient.post('/commissions/rules', data)).data;
export const updateCommissionRule = async (id: string, data: any) => (await apiClient.put(`/commissions/rules/${id}`, data)).data;
export const deleteCommissionRule = async (id: string) => (await apiClient.delete(`/commissions/rules/${id}`)).data;
export const calculatePayout = async (data: any) => (await apiClient.post('/commissions/payouts/calculate', data)).data;
export const markPayoutAsPaid = async (id: string) => (await apiClient.post(`/commissions/payouts/${id}/mark-paid`)).data;