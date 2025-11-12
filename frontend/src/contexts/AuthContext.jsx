import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
  useCallback, // Added useCallback for stability
} from 'react';
// Assuming the import path for apiService, getAccessToken, etc. is correct
import {
  apiService,
  getAccessToken,
  setAccessToken,
  clearTokens,
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
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.UPDATE_USER:
      return { ...state, user: { ...state.user, ...action.payload } };

    case AUTH_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };

    default:
      return state;
  }
};

// ==========================
// 🔹 Context & Provider
// ==========================
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [authVersion, setAuthVersion] = useState(0);

  // Memoize the access token check for stable dependency
  const currentToken = getAccessToken();
  const tokenIsPresent = !!currentToken;

  // ===========================================
  // 1️⃣ Initialize auth on app load
  // ===========================================
  useEffect(() => {
    const initializeAuth = async () => {
      const token = currentToken;
      console.log('🟢 [Auth Init] Starting initialization...');
      console.log(
        '📦 Stored Access Token:',
        token ? 'Found ✅' : 'Not Found ❌'
      );

      // Immediately set loading to true (it's true by default, but good practice)
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      if (token) {
        try {
          const response = await apiService.user.getProfile();
          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: { user: response.data.user || response.data },
          });
        } catch (error) {
          console.warn('⚠️ Invalid access token, trying refresh...');
          try {
            const refreshResponse = await apiService.auth.refresh();
            const { accessToken } = refreshResponse.data;
            if (accessToken) {
              setAccessToken(accessToken);
              const profileRes = await apiService.user.getProfile();
              dispatch({
                type: AUTH_ACTIONS.LOGIN_SUCCESS,
                payload: { user: profileRes.data.user || profileRes.data },
              });
            } else {
              clearTokens();
              dispatch({ type: AUTH_ACTIONS.LOGOUT });
            }
          } catch {
            clearTokens();
            dispatch({ type: AUTH_ACTIONS.LOGOUT });
          }
        }
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }

      console.log('🔚 [Auth Init] Initialization complete');
    };

    initializeAuth();
  }, []); // Empty dependency array: runs only on initial mount

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      console.log('🔁 Token detected after login — reinitializing profile...');
      apiService.user
        .getProfile()
        .then((res) => {
          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: { user: res.data.user || res.data },
          });
          console.log(
            '✅ User refreshed after login:',
            res.data.user || res.data
          );
        })
        .catch((err) => {
          console.warn('⚠️ Token exists but profile fetch failed:', err);
          clearTokens();
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
        });
    }
  }, [getAccessToken()]);

  // ===========================================
  // 2️⃣ Global logout listener
  // ===========================================
  useEffect(() => {
    const handleLogout = (event) => {
      console.log('🚪 Global logout event:', event.detail?.reason);
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      setAuthVersion((v) => v + 1);
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  // ===========================================
  // 🔹 Auth Actions
  // ===========================================
  const login = async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

    try {
      const response = await apiService.auth.login(credentials);
      const { user, tokens } = response.data;
      const token = tokens?.accessToken;
      if (token) setAccessToken(token);

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user },
      });
      setAuthVersion((v) => v + 1); // Force re-run of token-watcher effect
      return { success: true, user };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: message });
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

    try {
      const response = await apiService.auth.register(userData);
      const { user, accessToken } = response.data;
      if (accessToken) setAccessToken(accessToken);

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user },
      });
      setAuthVersion((v) => v + 1); // Force re-run of token-watcher effect
      return { success: true, user };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: message });
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      // Call API to clear cookies + revoke tokens
      await apiService.auth.logout();
    } catch (error) {
      console.error('Logout API failed:', error);
    } finally {
      // Full cleanup: localStorage, state, and force reload
      clearTokens();
      localStorage.clear(); // ensure all cached data is gone
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      console.log('🧹 User logged out completely.');

      // Force app reload to guarantee fresh auth context
      window.location.href = '/login';
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await apiService.user.updateProfile(profileData);
      dispatch({
        type: AUTH_ACTIONS.UPDATE_USER,
        payload: response.data,
      });
      return { success: true, user: response.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: message });
      return { success: false, error: message };
    }
  };

  const clearError = () => dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

  // ===========================================
  // 🔹 Context Value
  // ===========================================
  const value = {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,

    login,
    register,
    logout,
    updateProfile,
    clearError,
  };

  return (
    <AuthContext.Provider key={authVersion} value={value}>
      <React.Fragment key={state.user?.id || 'guest'}>
        {children}
      </React.Fragment>
    </AuthContext.Provider>
  );
};

// ==========================
// 🔹 Custom Hook
// ==========================
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export default AuthContext;
