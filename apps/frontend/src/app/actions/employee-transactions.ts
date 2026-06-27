import apiClient from '@/lib/apiClient';
export const getTransactionCategories = async () => (await apiClient.get('/employee-transactions/categories')).data;
export const createTransactionCategory = async (data: any) => (await apiClient.post('/employee-transactions/categories', data)).data;
export const createEmployeeTransaction = async (data: any) => (await apiClient.post('/employee-transactions', data)).data;
export const updateEmployeeTransaction = async (id: string, data: any) => (await apiClient.put(`/employee-transactions/${id}`, data)).data;
export const deleteEmployeeTransaction = async (id: string) => (await apiClient.delete(`/employee-transactions/${id}`)).data;
export const approveEmployeeTransaction = async (id: string, data: any) => (await apiClient.post(`/employee-transactions/${id}/approve`, data)).data;
export const rejectEmployeeTransaction = async (id: string) => (await apiClient.post(`/employee-transactions/${id}/reject`)).data;
export const approveMultipleEmployeeTransactions = async (data: any) => (await apiClient.post('/employee-transactions/approve-multiple', data)).data;