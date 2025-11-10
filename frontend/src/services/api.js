import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  withCredentials: true, // Include cookies for httpOnly refresh token
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management utilities
const TOKEN_KEY = 'access_token';

const getAccessToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

const setAccessToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    // Keep axios default header in sync so non-interceptor requests also send auth
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    // If we were previously blocking requests because of logout/refresh
    // failure, allow requests again when a valid token is set.
    stopRequests = false;
  } else {
    localStorage.removeItem(TOKEN_KEY);
    // remove default header when token cleared
    delete api.defaults.headers.common.Authorization;
  }
};

// (stopRequests is re-enabled inside setAccessToken when a token is set)

const clearTokens = () => {
  localStorage.removeItem(TOKEN_KEY);
  try {
    localStorage.removeItem('refresh_token');
  } catch (e) {
    // ignore storage errors
  }
  // remove default header when clearing tokens
  delete api.defaults.headers.common.Authorization;
  // Note: httpOnly refresh token will be cleared by server
  // Ensure requests are allowed again after tokens cleared so users can log back in
  stopRequests = false;
};

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue = [];
// When true, request interceptor will immediately reject new requests.
// This is set when the client is considered logged out (refresh failed)
let stopRequests = false;

// Client-side rate limit cooldown (stored in localStorage to persist across tabs)
const COOLDOWN_KEY = 'auth:cooldown_until';

const setCooldown = (seconds) => {
  try {
    const until = Date.now() + seconds * 1000;
    localStorage.setItem(COOLDOWN_KEY, String(until));
  } catch (e) {
    // ignore
  }
};

const getCooldownUntil = () => {
  try {
    const v = localStorage.getItem(COOLDOWN_KEY);
    return v ? parseInt(v, 10) : null;
  } catch (e) {
    return null;
  }
};

const isCooldownActive = () => {
  const until = getCooldownUntil();
  return !!until && Date.now() < until;
};

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

// Request interceptor to add Bearer token
api.interceptors.request.use(
  (config) => {
    // If the client has been marked logged-out, short-circuit requests to avoid
    // spamming the server while redirect/navigation is in progress.
    if (stopRequests) {
      // Allow auth-related requests to proceed even when requests are
      // otherwise being blocked (e.g. after a failed refresh). This ensures
      // users can still POST to /auth/login or /auth/register to sign in.
      const url = (config.url || '').toString();
      const authWhitelist = ['/auth/login', '/auth/register', '/auth/refresh'];
      const isAuthRequest = authWhitelist.some((p) => url.includes(p));

      if (!isAuthRequest) {
        const err = new Error('Client logged out - requests blocked');
        // mark with a status so response error handlers / UI can interpret it
        err.status = 401;
        err.isClientLoggedOut = true;
        return Promise.reject(err);
      }
      // If it's an auth request, allow it through so the user can login.
    }
    const token = getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`
      );
    }

    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh logic
api.interceptors.response.use(
  (response) => {
    // Log successful response in development
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `✅ API Response: ${response.config.method?.toUpperCase()} ${
          response.config.url
        } - ${response.status}`
      );
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Log error in development — be defensive so we don't print 'undefined undefined - undefined'
    if (process.env.NODE_ENV === 'development') {
      const cfg = originalRequest || {};
      const method = (cfg.method || error?.request?.method || 'UNKNOWN')
        .toString()
        .toUpperCase();
      const url = cfg.url || error?.request?.responseURL || 'UNKNOWN_URL';
      const status =
        error.response?.status || error.status || error.code || 'NO_STATUS';
      console.log(`❌ API Error: ${method} ${url} - ${status}`);
    }

    // Handle 429 Too Many Requests: set a cooldown and notify app
    if (error.response?.status === 429) {
      // Try to read Retry-After header (seconds) or response body retryAfter
      const retryAfterHeader = error.response.headers?.['retry-after'];
      const retryAfterBody = error.response.data?.retryAfter;
      let retrySeconds = 60; // default 1 minute

      if (retryAfterHeader) {
        const parsed = parseInt(retryAfterHeader, 10);
        if (!Number.isNaN(parsed)) retrySeconds = parsed;
      } else if (retryAfterBody && !Number.isNaN(Number(retryAfterBody))) {
        retrySeconds = Number(retryAfterBody);
      } else if (
        error.response.data?.retryAfter &&
        typeof error.response.data.retryAfter === 'string'
      ) {
        const parsed = parseInt(error.response.data.retryAfter, 10);
        if (!Number.isNaN(parsed)) retrySeconds = parsed;
      }

      // store client-side cooldown to avoid spamming the server
      setCooldown(retrySeconds);

      // Dispatch an event so UI can show a rate-limit message if desired
      window.dispatchEvent(
        new CustomEvent('auth:rate-limited', {
          detail: { retryAfter: retrySeconds, status: 429 },
        })
      );

      // Reject with a clear error
      const rateError = new Error('Too many requests. Please try again later.');
      rateError.retryAfter = retrySeconds;
      rateError.status = 429;
      return Promise.reject(rateError);
    }

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If this error was returned for an auth endpoint (login/register),
      // don't try to perform a silent refresh. Let the caller handle the
      // 401 (e.g. show invalid credentials) instead of triggering global
      // refresh/logout flows which could block sign-in attempts.
      const reqUrl =
        (originalRequest && (originalRequest.url || originalRequest.baseURL)) ||
        '';
      if (reqUrl.includes('/auth/login') || reqUrl.includes('/auth/register')) {
        return Promise.reject(error);
      }
      // If server-side rate-limit cooldown still active on client, don't attempt refresh
      if (isCooldownActive()) {
        const until = getCooldownUntil();
        const remaining = Math.max(0, Math.ceil((until - Date.now()) / 1000));
        const cooldownErr = new Error('Rate limit cooldown active');
        cooldownErr.retryAfter = remaining;
        cooldownErr.status = 429;
        return Promise.reject(cooldownErr);
      }
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh the token using httpOnly refresh cookie
        const refreshResponse = await axios.post(
          `${
            process.env.REACT_APP_API_URL || 'http://localhost:3001/api'
          }/auth/refresh`,
          {},
          {
            withCredentials: true, // Send httpOnly refresh cookie
            timeout: 5000,
          }
        );

        // Accept multiple possible shapes from backend refresh response
        const data = refreshResponse.data || {};
        const accessToken =
          data?.accessToken ||
          data?.token ||
          data?.tokens?.accessToken ||
          data?.tokens?.access_token ||
          null;

        if (accessToken) {
          // Update stored access token and axios defaults
          setAccessToken(accessToken);

          api.defaults.headers.Authorization = `Bearer ${accessToken}`;

          // Process queued requests with new token
          processQueue(null, accessToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;

          if (process.env.NODE_ENV === 'development') {
            console.log('✅ Token refreshed successfully');
          }

          return api(originalRequest);
        }

        throw new Error('No access token received from refresh');
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);

        // Clear tokens
        clearTokens();
        processQueue(refreshError, null);

        // Dispatch logout event for AuthContext to handle
        window.dispatchEvent(
          new CustomEvent('auth:logout', {
            detail: { reason: 'token_refresh_failed' },
          })
        );

        // Redirect to login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle other error cases
    if (error.response?.status >= 500) {
      console.error('🚨 Server Error:', error.response.data);
      // Could dispatch global error event here
      window.dispatchEvent(
        new CustomEvent('api:server-error', {
          detail: { error: error.response.data },
        })
      );
    }

    // Network errors
    if (error.code === 'ECONNABORTED') {
      console.error('⏰ Request timeout');
      error.message =
        'Request timeout. Please check your connection and try again.';
    } else if (!error.response) {
      // This covers network errors and client-blocked requests
      console.error('🔌 Network Error:', error.message);
      error.message =
        'Network error. Please check your connection and try again.';
    }

    return Promise.reject(error);
  }
);

// API service methods
export const apiService = {
  // Authentication methods
  auth: {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    logout: () => api.post('/auth/logout'),
    refresh: () => api.post('/auth/refresh'),
    // Retry refresh by supplying refresh token explicitly (used for dev fallback)
    refreshWithToken: (refreshToken) =>
      api.post('/auth/refresh', { refreshToken }),
    forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
    resetPassword: (token, password) =>
      api.post('/auth/reset-password', { token, password }),
  },

  // User methods
  user: {
    getProfile: () => api.get('/users/profile'),
    updateProfile: (data) => api.put('/users/profile', data),
    deleteAccount: () => api.delete('/users/profile'),
    changePassword: (data) => api.put('/users/change-password', data),
  },

  // Goals methods
  goals: {
    getAll: () => api.get('/goals'),
    create: (goal) => api.post('/goals', goal),
    update: (id, goal) => api.put(`/goals/${id}`, goal),
    delete: (id) => api.delete(`/goals/${id}`),
    getById: (id) => api.get(`/goals/${id}`),
  },

  // Challenges methods
  challenges: {
    getAll: (params) => api.get('/challenges', { params }),
    create: (data) => api.post('/challenges', data),
    getById: (id) => api.get(`/challenges/${id}`),
    delete: (id) => api.delete(`/challenges/${id}`),
    // Submit work for a challenge — prefer centralized /submissions endpoint
    submit: (id, submission) =>
      api.post('/submissions', { challengeId: id, ...submission }),
    getSubmissions: (id) => api.get(`/challenges/${id}/submissions`),
  },

  // Submissions endpoints (new centralized API)
  submissions: {
    // Create a submission: { challengeId, content, files? }
    create: (payload) => api.post('/submissions', payload),
    // Mark a challenge as completed without upload
    markComplete: (challengeId) =>
      api.post(`/submissions/challenge/${challengeId}/complete`),
    // Get a single submission
    getById: (id) => api.get(`/submissions/${id}`),
    // Update submission
    update: (id, data) => api.put(`/submissions/${id}`, data),
    // Get user's submissions (peer review page uses apiService.peerReview.getMySubmissions())
  },

  // Progress methods
  progress: {
    getOverview: () => api.get('/progress/overview'),
    getSkills: () => api.get('/progress/skills'),
    getActivity: (params) => api.get('/progress/activity', { params }),
    getStats: () => api.get('/progress/stats'),
  },

  // Leaderboard methods
  leaderboard: {
    // Backend expects GET /api/leaderboard with optional query ?period=weekly|monthly|alltime&limit=50
    getGlobal: (params) => api.get('/leaderboard', { params }),
    // Get current user's rank and total points
    getUserRank: () => api.get('/leaderboard/ranking'),
    // Get detailed points breakdown for the logged-in user
    getPointsBreakdown: () => api.get('/leaderboard/points'),
    // Get achievements/badges for the logged-in user
    getAchievements: () => api.get('/leaderboard/achievements'),
  },

  // Peer Review methods
  peerReview: {
    getReviewQueue: (params) => api.get('/peer-review/queue', { params }),
    getMySubmissions: () => api.get('/peer-review/my-submissions'),
    submitReview: (submissionId, review) =>
      api.post(`/peer-review/submissions/${submissionId}/review`, review),
    getReviewDetails: (submissionId) =>
      api.get(`/peer-review/submissions/${submissionId}`),
  },

  // Notifications methods
  notifications: {
    getAll: () => api.get('/notifications'),
    markAsRead: (id) => api.put(`/notifications/${id}/read`),
    markAllAsRead: () => api.put('/notifications/read-all'),
  },
};

// Export utilities for external use
export { getAccessToken, setAccessToken, clearTokens };

// Export configured axios instance
export default api;
