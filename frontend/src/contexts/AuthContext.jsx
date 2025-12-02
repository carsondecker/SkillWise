import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
} from 'react';

import {
  apiService,
  setInMemoryAccessToken,
  clearInMemoryAccessToken,
  setInMemoryRefreshToken,
  clearInMemoryRefreshToken,
} from '../services/api';

// ==========================
// 🔹 Initial State & Actions
// ==========================
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// ==========================
// 🔹 Reducer
// ==========================
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.LOGOUT:
      return { ...initialState, isLoading: false };

    case AUTH_ACTIONS.UPDATE_USER:
      return { ...state, user: { ...state.user, ...action.payload } };

    case AUTH_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };

    default:
      return state;
  }
};

const AuthContext = createContext(null);

// ======================================================
// 🔥 CONFIG
// ======================================================
const IDLE_TIMEOUT = 10 * 60 * 1000; // 10 minutes
const REFRESH_THRESHOLD = 4 * 60 * 1000; // Refresh if token is >4 minutes old

// ==========================
// 🔹 Provider
// ==========================
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // ======================================================
  // 1️⃣ Track user activity (mouse, keyboard, clicks)
  // ======================================================
  useEffect(() => {
    const updateActivity = () => setLastActivity(Date.now());

    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('scroll', updateActivity);

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
    };
  }, []);

  // ======================================================
  // 2️⃣ INITIAL LOAD — validate or refresh token
  // ======================================================
  useEffect(() => {
    const initialize = async () => {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      const publicPaths = ['/login', '/signup', '/forgot-password', '/'];
      const currentPath = window.location.pathname;

      // Skip auth bootstrap on public pages to avoid redirect loops for new users
      if (publicPaths.includes(currentPath)) {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        return;
      }

      try {
        const profile = await apiService.user.getProfile();
        setInMemoryAccessToken(null); // trust cookies for now
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user: profile.data.user || profile.data },
        });
      } catch {
        // Try refresh
        try {
          const refreshRes = await apiService.auth.refresh();
          if (refreshRes?.data?.accessToken) {
            setInMemoryAccessToken(refreshRes.data.accessToken);
          }
          if (refreshRes?.data?.refreshToken) {
            setInMemoryRefreshToken(refreshRes.data.refreshToken);
          }

          // no token body expected; rely on cookies
          const profile = await apiService.user.getProfile();
          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: { user: profile.data.user || profile.data },
          });
        } catch {
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }
      } finally {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    };

    initialize();
  }, []);

  // ======================================================
  // 3️⃣ ACTIVITY-BASED AUTO REFRESH
  // ======================================================
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!state.isAuthenticated) return;

      const now = Date.now();
      const sinceLastActivity = now - lastActivity;

      // 🚪 Auto-logout after 10 min inactivity
      if (sinceLastActivity > IDLE_TIMEOUT) {
        console.log("⏳ User idle for too long → logging out.");
        logout();
        return;
      }

      // 🔄 Only refresh if user is active
      if (sinceLastActivity < 2000) {
        try {
          const refreshRes = await apiService.auth.refresh();
          if (refreshRes?.data?.accessToken) {
            setInMemoryAccessToken(refreshRes.data.accessToken);
          }
          if (refreshRes?.data?.refreshToken) {
            setInMemoryRefreshToken(refreshRes.data.refreshToken);
          }
          console.log("🔄 Token refreshed (active user)");
        } catch (err) {
          console.warn("⚠️ Refresh failed:", err);
        }
      }
    }, REFRESH_THRESHOLD);

    return () => clearInterval(interval);
  }, [state.isAuthenticated, lastActivity]);

  // ======================================================
  // 🔹 Auth Actions
  // ======================================================
  const login = async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

    try {
      const response = await apiService.auth.login(credentials);
      const { user, accessToken } = response.data;

      if (accessToken) setInMemoryAccessToken(accessToken);
      if (response.data?.refreshToken) setInMemoryRefreshToken(response.data.refreshToken);

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user },
      });

      return { success: true, user };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: message });
      return { success: false, error: message };
    } finally {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  };

  const logout = async () => {
    try {
      await apiService.auth.logout();
    } catch (err){
      console.warn("⚠️ Logout request failed:", err);
    }
    clearInMemoryAccessToken();
    clearInMemoryRefreshToken();
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
    window.location.href = '/login';
  };

  const register = async (data) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    try {
      const response = await apiService.auth.register(data);
      const { accessToken } = response.data;

      if (accessToken) setInMemoryAccessToken(accessToken);
      if (response.data?.refreshToken) setInMemoryRefreshToken(response.data.refreshToken);

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user: response.data.user },
      });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: message });
      return { success: false, error: message };
    } finally {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isLoading: state.isLoading,
        error: state.error,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ==========================
// 🔹 Hook
// ==========================
export const useAuth = () => useContext(AuthContext);
