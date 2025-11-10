import React, { createContext, useContext, useReducer, useEffect } from 'react';
import {
  apiService,
  getAccessToken,
  setAccessToken,
  clearTokens,
} from '../services/api';

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Action types
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };

    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};

// Create context
const AuthContext = createContext(null);

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is authenticated on app load
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🟢 [Auth Init] Starting initialization...');

      const token = getAccessToken();
      console.log(
        '📦 Stored Access Token:',
        token ? 'Found ✅' : 'Not Found ❌'
      );

      // If access token exists, try to load profile. If it fails, attempt refresh.
      if (token) {
        try {
          console.log(
            '➡️ [Auth Init] Trying /users/profile with access token...'
          );
          const response = await apiService.user.getProfile();
          console.log('✅ [Auth Init] /users/profile success:', response.data);

          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: { user: response.data.user || response.data },
          });
          return;
        } catch (error) {
          console.warn(
            '⚠️ [Auth Init] Access token invalid or expired, attempting refresh...'
          );
          console.error(
            '❌ [Auth Init] Profile fetch failed:',
            error.response?.status,
            error.response?.data
          );
        }
      }

      // No valid access token or profile fetch failed — try silent refresh using httpOnly cookie
      try {
        console.log(
          '➡️ [Auth Init] Attempting silent refresh via /auth/refresh...'
        );
        const refreshResponse = await apiService.auth.refresh();
        console.log(
          '✅ [Auth Init] /auth/refresh response:',
          refreshResponse.data
        );

        // Support multiple response shapes: { accessToken }, { token }, { tokens: { accessToken } }
        const accessToken =
          refreshResponse.data?.accessToken ||
          refreshResponse.data?.token ||
          refreshResponse.data?.tokens?.accessToken ||
          refreshResponse.data?.tokens?.access_token;

        if (accessToken) {
          console.log('💾 [Auth Init] New access token received, saving...');
          setAccessToken(accessToken);

          console.log(
            '➡️ [Auth Init] Fetching profile with refreshed token...'
          );
          const profileRes = await apiService.user.getProfile();
          console.log(
            '✅ [Auth Init] /users/profile success (after refresh):',
            profileRes.data
          );

          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: { user: profileRes.data.user || profileRes.data },
          });
          return;
        }

        console.log('🚫 [Auth Init] Silent refresh returned no access token');
        clearTokens();
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      } catch (refreshError) {
        console.warn(
          '❌ [Auth Init] Silent refresh failed or no refresh cookie present:',
          refreshError?.response?.status,
          refreshError?.response?.data
        );
        // Attempt a fallback: if a refresh token was saved to localStorage
        // (dev convenience), retry refresh using that token once. This helps
        // environments where httpOnly cookies are not sent in dev.
        try {
          const stored = localStorage.getItem('refresh_token');
          if (stored) {
            console.log(
              '➡️ [Auth Init] Retrying refresh with stored refresh_token'
            );
            const retryRes = await apiService.auth.refreshWithToken(stored);
            const accessToken =
              retryRes.data?.accessToken ||
              retryRes.data?.token ||
              retryRes.data?.tokens?.accessToken ||
              retryRes.data?.tokens?.access_token;
            if (accessToken) {
              setAccessToken(accessToken);
              const profileRes = await apiService.user.getProfile();
              dispatch({
                type: AUTH_ACTIONS.LOGIN_SUCCESS,
                payload: { user: profileRes.data.user || profileRes.data },
              });
              return;
            }
          }
        } catch (retryErr) {
          console.warn(
            '[Auth Init] Refresh retry with stored token failed:',
            retryErr?.response?.status
          );
        }

        clearTokens();
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      } finally {
        console.log('🔚 [Auth Init] Initialization complete');
      }
    };

    initializeAuth();
  }, []);

  // Listen for logout events from API interceptors
  useEffect(() => {
    const handleLogout = (event) => {
      console.log('Logout event received:', event.detail?.reason);
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      // Ensure we navigate to login when a logout event occurs. Some code paths
      // (e.g. axios interceptor) also redirect, but ensuring here covers cases
      // where the interceptor couldn't perform the navigation.
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    };

    window.addEventListener('auth:logout', handleLogout);

    return () => {
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, []);

  // Login function
  const login = async (credentials) => {
    // If server told us to cooldown, prevent login attempts client-side
    try {
      const cooldownUntil = localStorage.getItem('auth:cooldown_until');
      if (cooldownUntil && Date.now() < Number(cooldownUntil)) {
        const remaining = Math.ceil(
          (Number(cooldownUntil) - Date.now()) / 1000
        );
        const message = `Too many requests. Try again in ${remaining} seconds.`;
        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: message });
        return { success: false, error: message };
      }
    } catch (e) {
      // ignore storage errors
    }

    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

    try {
      const response = await apiService.auth.login(credentials);
      const { user, tokens } = response.data;

      // ✅ Support both field names
      // Accept multiple token shapes (tokens.accessToken | accessToken | token)
      const token =
        tokens?.accessToken ||
        response.data?.accessToken ||
        response.data?.token;

      if (token) {
        setAccessToken(token);
      } else {
        console.warn(
          '⚠️ No access token found in login response:',
          response.data
        );
      }

      // Persist user in localStorage for other helpers that rely on it
      try {
        if (user) localStorage.setItem('user', JSON.stringify(user));
      } catch (e) {
        // ignore storage errors
      }

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user },
      });

      return { success: true, user };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (userData) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

    try {
      const response = await apiService.auth.register(userData);
      const { user, accessToken } = response.data;

      // Store access token
      setAccessToken(accessToken);

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user },
      });

      return { success: true, user };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || 'Registration failed';
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

    try {
      // Call logout endpoint to clear httpOnly refresh cookie
      await apiService.auth.logout();
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API call failed:', error);
    } finally {
      // Clear tokens and update state
      clearTokens();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  // Update profile function
  const updateProfile = async (profileData) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

    try {
      const response = await apiService.user.updateProfile(profileData);
      const updatedUser = response.data;

      dispatch({
        type: AUTH_ACTIONS.UPDATE_USER,
        payload: updatedUser,
      });

      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      return { success: true, user: updatedUser };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || 'Profile update failed';
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  // Change password function
  const changePassword = async (passwordData) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

    try {
      await apiService.user.changePassword(passwordData);
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      return { success: true };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || 'Password change failed';
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  // Forgot password function
  const forgotPassword = async (email) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

    try {
      await apiService.auth.forgotPassword(email);
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      return { success: true };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || 'Password reset request failed';
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  // Reset password function
  const resetPassword = async (token, password) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

    try {
      await apiService.auth.resetPassword(token, password);
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      return { success: true };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || 'Password reset failed';
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Context value
  const value = {
    // State
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,

    // Actions
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export default AuthContext;
