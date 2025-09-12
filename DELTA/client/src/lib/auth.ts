import { apiRequest } from "./queryClient";

export interface User {
  id: string;
  username: string;
  discriminator: string;
  avatar: string;
}

export const authService = {
  async getDiscordAuthUrl(): Promise<string> {
    const response = await apiRequest('GET', '/api/auth/discord');
    const data = await response.json();
    return data.url;
  },

  async handleDiscordCallback(code: string): Promise<User> {
    const response = await apiRequest('POST', '/api/auth/callback', { code });
    const data = await response.json();
    return data.user;
  },

  async logout(): Promise<void> {
    await apiRequest('POST', '/api/auth/logout');
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await apiRequest('GET', '/api/auth/me');
      return await response.json();
    } catch (error) {
      return null;
    }
  }
};
