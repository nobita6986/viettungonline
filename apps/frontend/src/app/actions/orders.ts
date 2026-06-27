import apiClient from '@/lib/apiClient';
export const createOrder = async (data: any) => (await apiClient.post('/orders', data)).data;
export const updateOrder = async (id: string, data: any) => (await apiClient.put(`/orders/${id}`, data)).data;
export const deleteOrder = async (id: string) => (await apiClient.delete(`/orders/${id}`)).data;