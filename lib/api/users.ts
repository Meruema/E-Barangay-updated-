import axiosInstance from '@/lib/axios';

export interface User {
  id: string;
  fullName: string;
  address: string;
  email: string;
  roleId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function createUser(
  email: string,
  fullName: string,
  address: string,
  password?: string,
  authUserId?: string,
): Promise<User> {
  const response = await axiosInstance.post('/users', {
    email,
    fullName,
    address,
    password,
    authUserId,
  });
  return response.data;
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const response = await axiosInstance.get(`/users?id=${id}`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const response = await axiosInstance.get(`/users?email=${email}`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await axiosInstance.get('/users');
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401 || error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}
