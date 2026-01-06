'use client';

import { useState, useEffect } from 'react';
import axiosInstance from '@/lib/axios';
import { ItemWithCategory, Category } from '@/lib/database.types';

export function useItems(type?: 'service' | 'facility', barangayId?: string) {
  const [items, setItems] = useState<ItemWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchItems() {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams();
        if (type) {
          params.append('type', type);
        }
        if (barangayId) {
          params.append('barangayId', barangayId);
        }
        const response = await axiosInstance.get(`/items?${params.toString()}`);
        setItems(response.data);
      } catch (err: any) {
        console.error('Error fetching items:', err);
        setError(err.response?.data?.error || 'Failed to fetch items');
        setItems([]);
      } finally {
        setLoading(false);
      }
    }

    fetchItems();
  }, [type, barangayId]);

  return { items, loading, error };
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true);
        setError(null);
        const response = await axiosInstance.get('/categories');
        setCategories(response.data);
      } catch (err: any) {
        console.error('Error fetching categories:', err);
        setError(err.response?.data?.error || 'Failed to fetch categories');
        setCategories([]);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  return { categories, loading, error };
}

export function useItemById(id: string | null) {
  const [item, setItem] = useState<ItemWithCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchItem() {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await axiosInstance.get(`/items?id=${id}`);
        setItem(response.data);
      } catch (err: any) {
        console.error('Error fetching item:', err);
        setError(err.response?.data?.error || 'Failed to fetch item');
        setItem(null);
      } finally {
        setLoading(false);
      }
    }

    fetchItem();
  }, [id]);

  return { item, loading, error };
}
