import apiClient from '@/lib/apiClient';
export const createTransaction = async (data: any) => (await apiClient.post('/transactions', data)).data;
export const updateTransaction = async (id: string, data: any) => (await apiClient.put(`/transactions/${id}`, data)).data;
export const deleteTransaction = async (id: string) => (await apiClient.delete(`/transactions/${id}`)).data;