import apiClient from '@/lib/apiClient';
export const createCustomer = async (data: any) => (await apiClient.post('/customers', data)).data;
export const updateCustomer = async (id: string, data: any) => (await apiClient.put(`/customers/${id}`, data)).data;
export const deleteCustomer = async (id: string) => (await apiClient.delete(`/customers/${id}`)).data;