import apiClient from '@/lib/apiClient';
export const getInventoryHistory = async () => (await apiClient.get('/inventory/history')).data;
export const importStock = async (data: any) => (await apiClient.post('/inventory/import', data)).data;
export const adjustStock = async (data: any) => (await apiClient.post('/inventory/adjust', data)).data;