'use client';

import { useEffect, useState } from 'react';
import axiosInstance from '@/lib/axios';

interface User {
  id: string;
  email: string;
  barangayId: string | null;
  username: string;
  role: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch current user from API
    const fetchUser = async () => {
      try {
        const response = await axiosInstance.get('/auth/me');
        setUser(response.data.user);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    // Only check on mount, not periodically
  }, []);

  return { user, loading };
}
