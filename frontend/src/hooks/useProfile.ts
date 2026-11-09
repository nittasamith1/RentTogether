import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '../services/profile';
import { DetailedStudentProfile, StudentProfileUpdatePayload, PublicStudentProfile } from '../types';

export const PROFILE_KEYS = {
  all: ['profile'] as const,
  me: () => [...PROFILE_KEYS.all, 'me'] as const,
  public: (studentId: string) => [...PROFILE_KEYS.all, 'public', studentId] as const,
  reviews: (studentId: string) => [...PROFILE_KEYS.all, 'reviews', studentId] as const,
};

export const useProfile = () => {
  return useQuery<DetailedStudentProfile, Error>({
    queryKey: PROFILE_KEYS.me(),
    queryFn: () => profileService.getProfileMe(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const usePublicProfile = (studentId?: string) => {
  return useQuery<PublicStudentProfile, Error>({
    queryKey: PROFILE_KEYS.public(studentId || ''),
    queryFn: () => profileService.getPublicProfile(studentId!),
    enabled: Boolean(studentId),
    staleTime: 1000 * 60 * 2,
  });
};

export const useStudentReviews = (studentId?: string) => {
  return useQuery({
    queryKey: PROFILE_KEYS.reviews(studentId || ''),
    queryFn: () => profileService.getStudentReviews(studentId!),
    enabled: Boolean(studentId),
    staleTime: 1000 * 60 * 2,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: StudentProfileUpdatePayload) => profileService.updateProfileMe(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(PROFILE_KEYS.me(), data);
      queryClient.invalidateQueries({ queryKey: PROFILE_KEYS.all });
    },
  });
};

