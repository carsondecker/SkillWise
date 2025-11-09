// Authentication service using shared API client
import { apiService, setAccessToken, clearTokens } from './api';

export const authService = {
  // Login user via backend and store user + access token
  async login(email, password) {
    try {
      const response = await apiService.auth.login({ email, password });

      // Backend responds with { user, tokens: { accessToken, refreshToken } }
      const { user, tokens } = response.data;

      if (tokens?.accessToken) {
        // Use shared token setter so interceptors and storage stay consistent
        setAccessToken(tokens.accessToken);
      }

      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }

      return { user, tokens };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  // Register new user
  async register(userData) {
    try {
      const response = await apiService.auth.register(userData);

      const { user, tokens } = response.data;

      if (tokens?.accessToken) setAccessToken(tokens.accessToken);
      if (user) localStorage.setItem('user', JSON.stringify(user));

      return { user, tokens };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  },

  // Logout user (server-side cookie cleared) and local cleanup
  async logout() {
    try {
      await apiService.auth.logout();
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      clearTokens();
      localStorage.removeItem('user');

      // Notify app that logout happened
      window.dispatchEvent(
        new CustomEvent('auth:logout', { detail: { reason: 'user_logout' } }),
      );
    }
  },

  // Refresh access token using httpOnly refresh cookie via shared api
  async refreshToken() {
    const response = await apiService.auth.refresh();
    const accessToken = response.data?.accessToken;

    if (accessToken) {
      setAccessToken(accessToken);
      return accessToken;
    }

    throw new Error('No access token returned from refresh');
  },

  // Get current user from localStorage
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Check if user is authenticated (access token present)
  isAuthenticated() {
    return (
      !!localStorage.getItem('access_token') || !!localStorage.getItem('user')
    );
  },
};

export default authService;
