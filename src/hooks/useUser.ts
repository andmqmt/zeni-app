import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService, userService } from '@/lib/api/auth.service';
import { UserProfile, UserPreferences } from '@/types';

export const useProfile = () => {
  return useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: () => userService.getProfile(),
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (updates: Partial<UserProfile>) => userService.updateProfile(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const useInitPreferences = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (preferences: UserPreferences) => userService.initPreferences(preferences),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const useUpdatePreferences = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (preferences: Partial<UserPreferences>) => userService.updatePreferences(preferences),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};
