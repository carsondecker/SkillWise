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

      // Store refresh token for dev fallback retry (stored in localStorage).
      // NOTE: This is a convenience for development environments only. In
      // production you should prefer httpOnly cookies and avoid client storage
      // of refresh tokens. If you want stricter behavior, guard this with
      // NODE_ENV !== 'production'.
      try {
        // Only persist refresh token in non-production (dev) environments
        if (process.env.NODE_ENV !== 'production' && tokens?.refreshToken) {
          localStorage.setItem('refresh_token', tokens.refreshToken);
        }
      } catch (e) {
        // ignore storage errors
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
      // Store refresh token for dev fallback (also on register)
      try {
        if (process.env.NODE_ENV !== 'production' && tokens?.refreshToken)
          localStorage.setItem('refresh_token', tokens.refreshToken);
      } catch (e) {
        // ignore storage errors
      }
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
        new CustomEvent('auth:logout', { detail: { reason: 'user_logout' } })
      );
    }
  },

  // Refresh access token using httpOnly refresh cookie via shared api
  async refreshToken() {
    const response = await apiService.auth.refresh();
    // Accept multiple shapes for compatibility with backend
    const accessToken =
      response.data?.accessToken ||
      response.data?.token ||
      response.data?.tokens?.accessToken ||
      response.data?.tokens?.access_token;

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
