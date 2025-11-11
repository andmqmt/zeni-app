import { api, setToken } from './client';
import { LoginCredentials, RegisterData, TokenResponse, UserProfile, UserPreferences } from '@/types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<TokenResponse> {
    const body = new URLSearchParams();
    body.set('username', credentials.identifier);
    body.set('password', credentials.password);

    const { data } = await api.post<TokenResponse>('/auth/login', body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    setToken(data.access_token);
    return data;
  },

  async register(registerData: RegisterData): Promise<UserProfile> {
    const { data } = await api.post<UserProfile>('/auth/register', registerData);
    return data;
  },

  async getCurrentUser(): Promise<UserProfile> {
    const { data } = await api.get<UserProfile>('/auth/me');
    return data;
  },
};

export const userService = {
  async getProfile(): Promise<UserProfile> {
    const { data } = await api.get<UserProfile>('/user/profile');
    return data;
  },

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const { data } = await api.put<UserProfile>('/user/profile', updates);
    return data;
  },

  async getPreferences(): Promise<UserPreferences> {
    const { data } = await api.get<UserPreferences>('/user/preferences');
    return data;
  },

  async initPreferences(preferences: UserPreferences): Promise<UserPreferences> {
    const { data } = await api.post<UserPreferences>('/user/preferences/init', preferences);
    return data;
  },

  async updatePreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    const { data } = await api.put<UserPreferences>('/user/preferences', preferences);
    return data;
  },
};
