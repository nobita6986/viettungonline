import apiClient from '@/lib/apiClient';
export const createProduct = async (data: any) => (await apiClient.post('/products', data)).data;
export const updateProduct = async (id: string, data: any) => (await apiClient.put(`/products/${id}`, data)).data;
export const addProductUnit = async (data: any) => (await apiClient.post('/products/unit', data)).data;