import apiClient from '@/lib/apiClient';
export const getTransactionCategories = async () => (await apiClient.get('/employee-transactions/categories')).data;
export const createCategoryQuickly = async (data: any) => (await apiClient.post('/employee-transactions/categories', data)).data;