import axiosInstance from '@/lib/axios';
import { ItemWithCategory } from '@/lib/database.types';

export async function getItems(
  type?: 'service' | 'facility',
  barangayId?: string,
): Promise<ItemWithCategory[]> {
  const params = new URLSearchParams();
  if (type) {
    params.append('type', type);
  }
  if (barangayId) {
    params.append('barangayId', barangayId);
  }
  const response = await axiosInstance.get(`/items?${params.toString()}`);
  return response.data;
}

export async function getItemById(
  id: string,
): Promise<ItemWithCategory | null> {
  try {
    const response = await axiosInstance.get(`/items?id=${id}`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function getItemsByCategory(
  categoryId: string,
  type?: 'service' | 'facility',
): Promise<ItemWithCategory[]> {
  const params = new URLSearchParams();
  params.append('categoryId', categoryId);
  if (type) {
    params.append('type', type);
  }
  const response = await axiosInstance.get(`/items?${params.toString()}`);
  return response.data;
}

export async function searchItems(
  searchTerm: string,
  type?: 'service' | 'facility',
): Promise<ItemWithCategory[]> {
  const params = new URLSearchParams();
  params.append('search', searchTerm);
  if (type) {
    params.append('type', type);
  }
  const response = await axiosInstance.get(`/items?${params.toString()}`);
  return response.data;
}

export async function getAllItems(
  type?: 'service' | 'facility',
): Promise<ItemWithCategory[]> {
  const params = new URLSearchParams();
  if (type) params.append('type', type);
  const response = await axiosInstance.get(`/items?${params.toString()}`);
  return response.data;
}

export async function getItem(id: string): Promise<ItemWithCategory | null> {
  try {
    const response = await axiosInstance.get(`/items?id=${id}`);
    return response.data;
  } catch (err: any) {
    if (err.response?.status === 404) return null;
    throw err;
  }
}

export async function createItem(
  data: Partial<ItemWithCategory>,
): Promise<ItemWithCategory> {
  // NOTE: if you want file uploads, implement a multipart/form-data endpoint on your server.
  const response = await axiosInstance.post('/items', data);
  return response.data;
}

export async function updateItem(
  id: string,
  data: Partial<ItemWithCategory>,
): Promise<void> {
  // using PATCH style (body contains id and data) to match the pattern you used for requests
  await axiosInstance.patch('/items', { id, ...data });
}

export async function deleteItem(id: string): Promise<void> {
  // either send as query or as body depending on your backend. Here we use query param:
  await axiosInstance.delete(`/items?id=${id}`);
}
