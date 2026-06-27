import apiClient from '@/lib/apiClient';
export const createUser = async (data: any) => (await apiClient.post('/users', data)).data;
export const updateUser = async (id: string, data: any) => (await apiClient.put(`/users/${id}`, data)).data;
export const deleteUser = async (id: string) => (await apiClient.delete(`/users/${id}`)).data;
export const getRoles = async () => (await apiClient.get('/users/roles')).data;