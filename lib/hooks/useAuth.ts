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

    // Re-fetch user periodically to check session validity
    const interval = setInterval(fetchUser, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return { user, loading };
}
