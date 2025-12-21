import axiosInstance from '@/lib/axios';
import {
  Request,
  RequestWithDetails,
  RequestStatus,
} from '@/lib/database.types';

export async function createRequest(
  userId: string,
  itemId: string,
  reason?: string,
): Promise<Request> {
  const response = await axiosInstance.post('/requests', {
    userId,
    itemId,
    reason,
  });
  return response.data;
}

export async function getUserRequests(
  userId: string,
): Promise<RequestWithDetails[]> {
  const response = await axiosInstance.get(`/requests?userId=${userId}`);
  return response.data;
}

export async function getRequestById(
  requestId: string,
): Promise<RequestWithDetails | null> {
  try {
    const response = await axiosInstance.get(`/requests?id=${requestId}`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function updateRequestStatus(
  requestId: string,
  status: RequestStatus,
  adminUserId: string,
  remarks?: string,
): Promise<void> {
  await axiosInstance.patch('/requests', {
    id: requestId,
    status,
    adminUserId,
    remarks,
  });
}

export async function getAllRequests(
  barangayId?: string,
): Promise<RequestWithDetails[]> {
  let url = '/requests';
  if (barangayId) {
    url += `?barangayId=${barangayId}`;
  }
  const response = await axiosInstance.get(url);
  return response.data;
}
