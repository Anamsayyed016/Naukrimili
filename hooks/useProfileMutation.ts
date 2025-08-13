import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface ProfileFormData {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  jobTitle?: string;
  skills?: string[];
  education?: Array<{ school?: string; degree?: string; startYear?: string; endYear?: string }>;
  experience?: Array<{ company?: string; role?: string; startDate?: string; endDate?: string; description?: string }>;
  preferredJobType?: string;
  expectedSalary?: string;
  linkedin?: string;
  portfolio?: string;
}

export function useProfileMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ProfileFormData) => {
      const res = await apiClient.put('/user/profile', payload as any);
      if (!res.success) throw new Error(res.error || 'Failed to update profile');
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users', 'current'] });
      qc.invalidateQueries({ queryKey: ['users', 'profile'] });
    },
  });
}


