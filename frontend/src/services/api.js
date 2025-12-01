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

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue = [];
let inMemoryAccessToken = null;
let inMemoryRefreshToken = null;

export const setInMemoryAccessToken = (token) => {
  inMemoryAccessToken = token || null;
  if (token) {
    api.defaults.headers.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.Authorization;
  }
};
export const clearInMemoryAccessToken = () => setInMemoryAccessToken(null);
export const setInMemoryRefreshToken = (token) => {
  inMemoryRefreshToken = token || null;
};
export const clearInMemoryRefreshToken = () => setInMemoryRefreshToken(null);

const processQueue = (error) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve();
    }
  });

  failedQueue = [];
};

// Request interceptor to add Bearer token
api.interceptors.request.use(
  (config) => {
    if (inMemoryAccessToken) {
      config.headers.Authorization = `Bearer ${inMemoryAccessToken}`;
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

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `❌ API Error: ${originalRequest?.method?.toUpperCase()} ${
          originalRequest?.url
        } - ${error.response?.status}`
      );
    }

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
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

        const { accessToken } = refreshResponse.data;

        if (accessToken) {
          setInMemoryAccessToken(accessToken);
          if (refreshResponse.data?.refreshToken) {
            setInMemoryRefreshToken(refreshResponse.data.refreshToken);
          }

          // Process queued requests now that cookies are updated
          processQueue(null);

          console.log('✅ Token refreshed successfully');
          return api(originalRequest);
        } else {
          throw new Error('No access token received from refresh');
        }
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);

        // Redirect to login
        processQueue(refreshError);

        // Dispatch logout event for AuthContext to handle
        window.dispatchEvent(
          new CustomEvent('auth:logout', {
            detail: { reason: 'token_refresh_failed' },
          })
        );

        // Redirect to login page
        const publicPaths = ['/login', '/signup', '/forgot-password'];
        if (!publicPaths.includes(window.location.pathname)) {
          window.location.href = '/login';
        }

        clearInMemoryAccessToken();
        clearInMemoryRefreshToken();
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
    refresh: () =>
      api.post('/auth/refresh', inMemoryRefreshToken ? { refreshToken: inMemoryRefreshToken } : {}),
    forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
    resetPassword: (token, password) =>
      api.post('/auth/reset-password', { token, password }),
  },

  // User methods
  user: {
    getProfile: () => api.get('/users/profile'),
    getStatistics: () => api.get('/users/statistics'),

    // Update profile text fields (firstName, lastName, bio, etc.)
    updateProfile: (data) => api.put('/users/profile', data),

    // NEW: Upload or change profile image
    updateAvatar: (formData) =>
      api.put('/users/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),

    deleteAccount: () => api.delete('/users/profile'),
    changePassword: (data) => api.put('/users/change-password', data),
  },

  // Goals methods
  goals: {
    getAll: () => api.get('/goals'),
    create: (goal) => api.post('/goals', goal),
    update: (id, goal) => api.put(`/goals/${id}`, goal),
    delete: (id) => api.delete(`/goals/${id}`),
    createChallengeFromGoal: (id, payload) => api.post(`/goals/${id}/challenges`, payload),
    getById: (id) => api.get(`/goals/${id}`),
  },

  // Challenges methods
  challenges: {
    getAll: (params) => api.get('/challenges', { params }),
    getById: (id) => api.get(`/challenges/${id}`),
    create: (data) => api.post('/challenges', data),
    update: (id, data) => api.put(`/challenges/${id}`, data),
    markAsComplete: (id) => api.patch(`/challenges/${id}/complete`),
    submitForPeerReview: (id) => api.patch(`/challenges/${id}/submitForPeerReview`),
    getLatestSubmissions: (id) => api.get(`/challenges/${id}/latest-submissions`),
  },
  // --------------------------------
  // 🧩 Submission Endpoints
  // --------------------------------
  submissions: {
    // 🟢 Get all submissions for a user
    getUserSubmissions: (userId, params) =>
      api.get(`/submissions/user/${userId}`, { params }),

    // 🟡 Get a single submission by ID
    getById: (id) => api.get(`/submissions/${id}`),

    getForChallenge: (challengeId) =>
      api.get(`/submissions/challenge/${challengeId}`),

    // 🔵 Submit a new solution (with text + optional file)
    create: (formData) =>
      api.post('/submissions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),

    // 🟣 Update or resubmit an existing submission
    update: (id, data) => api.put(`/submissions/${id}`, data),
  },
  // --------------------------------
  // 🤖 AI Service
  // --------------------------------
  ai: {
    generateChallengeForGoal: (goalId, options = {}) =>
      api.post(`/ai/generate-challenge/${goalId}`, options),

    generateChallengesBulk: (payload) =>
      api.post('/ai/generate-challenges', payload),

    explainConcept: (payload) =>
      api.post('/ai/explain', payload),

    getAIFeedback: (submission) =>
      api.post('/ai/feedback', submission),

    gradeChallenge: (challengeId, payload = {}) =>
      api.post(`/ai/grade/challenge/${challengeId}`, payload),
  },

  // Progress methods
  progress: {
    getProgress: (params) => api.get('/progress', { params }),
    getLatestProgress: () => api.get('/progress/latest'),
    getOverview: () => api.get('/progress/overview'),
    getSkills: () => api.get('/progress/skills'),
    getActivity: (params) => api.get('/progress/activity', { params }),
    getStats: () => api.get('/progress/stats'),
  },

  // Leaderboard methods
  leaderboard: {
    /**
     * 🏆 Get leaderboard (global / weekly / monthly)
     * Example usage:
     *   apiService.leaderboard.get({ timeframe: 'weekly', limit: 20 })
     */
    get: (params = {}) => api.get('/leaderboard', { params }),

    /**
     * 🥇 Get top global performers
     * Example usage:
     *   apiService.leaderboard.getTop({ limit: 10 })
     */
    getTop: (params = {}) => api.get('/leaderboard/top', { params }),

    /**
     * 👤 Get a specific user’s rank
     * Example usage:
     *   apiService.leaderboard.getUserRank(3)
     */
    getUserRank: (userId) => api.get(`/leaderboard/user/${userId}`),

    /**
     * 📚 Get leaderboard for a specific challenge category
     * Example usage:
     *   apiService.leaderboard.getByCategory('programming')
     */
    getByCategory: (category, params = {}) =>
      api.get('/leaderboard/category', { params: { category, ...params } }),

    /**
     * 💎 Preview calculated achievement points
     * Example usage:
     *   apiService.leaderboard.previewAchievementPoints({
     *     difficulty: 'hard', category: 'goal_completion'
     *   })
     */
    previewAchievementPoints: (data) =>
      api.post('/leaderboard/achievement-points', data),
  },

  // Peer Review methods
  peerReview: {
    getReviewQueue: (params) => api.get('/peer-review/queue', { params }),
    getSubmissionById: (id) => api.get(`/peer-review/submissions/${id}`),
    getMySubmissions: () => api.get('/peer-review/my-submissions'),
    submitReview: (submissionId, payload) =>
      api.post(`/peer-review/submissions/${submissionId}/review`, payload),
    getReviewDetails: (submissionId) =>
      api.get(`/peer-review/submissions/${submissionId}`),
    getSubmissionReviews: (submissionId) =>
      api.get(`/peer-review/submissions/${submissionId}/reviews`),
  },

  // Notifications methods
  notifications: {
    getAll: () => api.get('/notifications'),
    markAsRead: (id) => api.put(`/notifications/${id}/read`),
    markAllAsRead: () => api.put('/notifications/read-all'),
  },
  // --------------------------------
  // ⭐ Streaks API
  // --------------------------------
  streaks: {
    /**
     * 🔥 Log today's streak
     * POST /api/streaks/log
     */
    log: () => api.post('/streaks/log'),

    /**
     * 🌟 Get current streak data
     * GET /api/streaks
     */
    getStreak: () => api.get('/streaks'),
  },
};

// Export configured axios instance
export default api;
