/**
 * Enhanced React Query Hooks for Users and Authentication
 * Provides real-time user data fetching with caching and session management
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { apiClient, API_ENDPOINTS } from '@/lib/api-client';
import type { User, UserProfile, UserStats } from '@/types/user';

// Query keys for consistent caching
export const userQueryKeys = {
  all: ['users'] as const,
  lists: () => [...userQueryKeys.all, 'list'] as const,
  list: (filters: any) => [...userQueryKeys.lists(), filters] as const,
  details: () => [...userQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...userQueryKeys.details(), id] as const,
  profile: () => [...userQueryKeys.all, 'profile'] as const,
  stats: () => [...userQueryKeys.all, 'stats'] as const,
  current: () => [...userQueryKeys.all, 'current'] as const,
  search: (query: string) => [...userQueryKeys.all, 'search', query] as const,
} as const;

// Fetch users list (admin only)
export function useUsers(filters: any = {}, options?: UseQueryOptions) {
  return useQuery({
    queryKey: userQueryKeys.list(filters),
    queryFn: async () => {
      const response = await apiClient.get<{ users: User[]; pagination: any }>(
        API_ENDPOINTS.USERS,
        filters
      );
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch users');
      }
      
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,    // 5 minutes
    ...options,
  });
}

// Fetch single user by ID
export function useUser(id: string, options?: UseQueryOptions) {
  return useQuery({
    queryKey: userQueryKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<User>(API_ENDPOINTS.USER_PROFILE(id));
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch user');
      }
      
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000,   // 15 minutes
    ...options,
  });
}

// Fetch current user profile
export function useCurrentUser(options?: UseQueryOptions) {
  return useQuery({
    queryKey: userQueryKeys.current(),
    queryFn: async () => {
      const response = await apiClient.get<UserProfile>(API_ENDPOINTS.AUTH_PROFILE);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch profile');
      }
      
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000,   // 15 minutes
    ...options,
  });
}

// Fetch user statistics
export function useUserStats(userId: string, options?: UseQueryOptions) {
  return useQuery({
    queryKey: userQueryKeys.stats(),
    queryFn: async () => {
      const response = await apiClient.get<UserStats>(API_ENDPOINTS.USER_STATS(userId));
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch user stats');
      }
      
      return response.data;
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,    // 5 minutes
    ...options,
  });
}

// Search users
export function useUserSearch(query: string, filters: any = {}, options?: UseQueryOptions) {
  return useQuery({
    queryKey: userQueryKeys.search(query),
    queryFn: async () => {
      const response = await apiClient.get<{ users: User[]; pagination: any }>(
        '/search/users',
        { q: query, ...filters }
      );
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to search users');
      }
      
      return response.data;
    },
    enabled: !!query.trim(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,    // 5 minutes
    ...options,
  });
}

// Create new user
export function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userData: Partial<User>) => {
      const response = await apiClient.post<User>(API_ENDPOINTS.USERS, userData);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to create user');
      }
      
      return response.data;
    },
    onSuccess: (newUser) => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
      
      // Add new user to cache
      queryClient.setQueryData(userQueryKeys.detail(newUser.id), newUser);
    },
    onError: (error) => {
      console.error('Failed to create user:', error);
    },
  });
}

// Update existing user
export function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<User> }) => {
      const response = await apiClient.put<User>(API_ENDPOINTS.USER_PROFILE(id), data);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to update user');
      }
      
      return response.data;
    },
    onSuccess: (updatedUser) => {
      // Update user in cache
      queryClient.setQueryData(userQueryKeys.detail(updatedUser.id), updatedUser);
      
      // Update current user if it's the same user
      queryClient.setQueryData(userQueryKeys.current(), updatedUser);
      
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to update user:', error);
    },
  });
}

// Delete user
export function useDeleteUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(API_ENDPOINTS.USER_PROFILE(id));
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete user');
      }
      
      return response.data;
    },
    onSuccess: (_, deletedId) => {
      // Remove user from cache
      queryClient.removeQueries({ queryKey: userQueryKeys.detail(deletedId) });
      
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to delete user:', error);
    },
  });
}

// Update current user profile
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (profileData: Partial<UserProfile>) => {
      const response = await apiClient.put<UserProfile>(API_ENDPOINTS.AUTH_PROFILE, profileData);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to update profile');
      }
      
      return response.data;
    },
    onSuccess: (updatedProfile) => {
      // Update current user in cache
      queryClient.setQueryData(userQueryKeys.current(), updatedProfile);
      
      // Update user detail if exists
      if (updatedProfile.id) {
        queryClient.setQueryData(userQueryKeys.detail(updatedProfile.id), updatedProfile);
      }
    },
    onError: (error) => {
      console.error('Failed to update profile:', error);
    },
  });
}

// Change password
export function useChangePassword() {
  return useMutation({
    mutationFn: async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
      const response = await apiClient.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to change password');
      }
      
      return response.data;
    },
    onError: (error) => {
      console.error('Failed to change password:', error);
    },
  });
}

// Request password reset
export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: async (email: string) => {
      const response = await apiClient.post('/auth/forgot-password', { email });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to request password reset');
      }
      
      return response.data;
    },
    onError: (error) => {
      console.error('Failed to request password reset:', error);
    },
  });
}

// Reset password with token
export function useResetPassword() {
  return useMutation({
    mutationFn: async ({ token, newPassword }: { token: string; newPassword: string }) => {
      const response = await apiClient.post('/auth/reset-password', {
        token,
        newPassword,
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to reset password');
      }
      
      return response.data;
    },
    onError: (error) => {
      console.error('Failed to reset password:', error);
    },
  });
}

// Verify email
export function useVerifyEmail() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (token: string) => {
      const response = await apiClient.post('/auth/verify-email', { token });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to verify email');
      }
      
      return response.data;
    },
    onSuccess: () => {
      // Invalidate current user to refetch with verified status
      queryClient.invalidateQueries({ queryKey: userQueryKeys.current() });
    },
    onError: (error) => {
      console.error('Failed to verify email:', error);
    },
  });
}

// Upload profile picture
export function useUploadProfilePicture() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (file: File) => {
      const response = await apiClient.upload<{ imageUrl: string }>('/upload/profile-picture', file);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to upload profile picture');
      }
      
      return response.data;
    },
    onSuccess: (data) => {
      // Update current user with new image URL
      queryClient.setQueryData(userQueryKeys.current(), (old: UserProfile | undefined) => {
        if (old) {
          return { ...old, profilePicture: data.imageUrl };
        }
        return old;
      });
    },
    onError: (error) => {
      console.error('Failed to upload profile picture:', error);
    },
  });
}
