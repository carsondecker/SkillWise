// TODO: Implement peer review and collaboration features
import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import api from '../services/api';
import useAuth from '../hooks/useAuth';

const PeerReviewPage = () => {
  const [reviews, setReviews] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('review-others');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [error, setError] = useState(null);
  const { user } = useAuth() || {};

  // helpers to normalize various API response shapes
  const extractItems = (payload) => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.results)) return payload.results;
    if (Array.isArray(payload?.submissions)) return payload.submissions;
    if (Array.isArray(payload?.assignments)) return payload.assignments;
    return [];
  };

  const loadData = async (opts = {}) => {
    setLoading(true);
    setError(null);
    try {
      // attempt two endpoints: assignments (to review) and submissions (my submissions)
      const paramsAssignments = {};
      if (opts.category && opts.category !== 'all') paramsAssignments.category = opts.category;

      // run both in parallel; if one fails, still show the other
      const [assignRes, myRes] = await Promise.allSettled([
        api.get('/peer-review/assignments', { params: paramsAssignments }),
        api.get('/peer-review/submissions', { params: { userId: user?.id } }),
      ]);

      if (assignRes.status === 'fulfilled') {
        const items = extractItems(assignRes.value?.data);
        setReviews(items);
      } else {
        // fallback: try common endpoint if first failed
        try {
          const fallback = await api.get('/peer-review', { params: paramsAssignments });
          setReviews(extractItems(fallback.data));
        } catch (e) {
          setReviews([]); // nothing available
        }
      }

      if (myRes.status === 'fulfilled') {
        setMySubmissions(extractItems(myRes.value?.data));
      } else {
        // fallback try /submissions endpoint scoped to user
        try {
          const fallbackMy = await api.get('/submissions', { params: { userId: user?.id } });
          setMySubmissions(extractItems(fallbackMy.data));
        } catch (e) {
          setMySubmissions([]);
        }
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to load peer review data');
      setReviews([]);
      setMySubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  // load on mount and when category or user changes
  useEffect(() => {
    loadData({ category: selectedCategory });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, user?.id]);

  const filteredReviews = reviews.filter(review =>
    selectedCategory === 'all' || (review.category || '').toLowerCase() === selectedCategory.toLowerCase()
  );

  const getStatusBadge = (status) => {
    const statusConfig = {
      'under-review': { text: 'Under Review', className: 'status-pending' },
      'completed': { text: 'Completed', className: 'status-completed' },
      'needs-revision': { text: 'Needs Revision', className: 'status-warning' },
    };
    const config = statusConfig[status] || { text: status || 'Unknown', className: 'status-default' };
    return <span className={`status-badge ${config.className}`}>{config.text}</span>;
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      'Beginner': '#4CAF50',
      'Intermediate': '#FF9800',
      'Advanced': '#F44336',
      'beginner': '#4CAF50',
      'intermediate': '#FF9800',
      'advanced': '#F44336',
    };
    return colors[difficulty] || '#757575';
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <div className="peer-review-page">
      <div className="page-header">
        <h1>Peer Review</h1>
        <p>Collaborate with fellow learners and improve together</p>
      </div>

      <div className="review-tabs">
        <button
          className={`tab-button ${activeTab === 'review-others' ? 'active' : ''}`}
          onClick={() => setActiveTab('review-others')}
        >
          Review Others ({reviews.filter(r => r.needsReview || r.reviewsNeeded || r.reviews_count === 0).length})
        </button>
        <button
          className={`tab-button ${activeTab === 'my-submissions' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-submissions')}
        >
          My Submissions ({mySubmissions.length})
        </button>
      </div>

      {activeTab === 'review-others' && (
        <div className="review-others-section">
          <div className="section-header">
            <h2>Help Others Improve</h2>
            <div className="filters">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="react">React</option>
                <option value="javascript">JavaScript</option>
                <option value="algorithms">Algorithms</option>
                <option value="css">CSS</option>
                <option value="database">Database</option>
              </select>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner message="Loading submissions for review..." />
          ) : error ? (
            <div className="error-state">
              <h3>Unable to load submissions</h3>
              <p>{error}</p>
              <button className="btn-secondary" onClick={() => loadData({ category: selectedCategory })}>Retry</button>
            </div>
          ) : (
            <div className="reviews-grid">
              {filteredReviews.map((review) => (
                <div key={review.id || review.submissionId} className="review-card">
                  <div className="review-header">
                    <div className="author-info">
                      <span className="author-avatar">{review.authorAvatar || '👤'}</span>
                      <div>
                        <h4>{review.title || review.submissionTitle}</h4>
                        <p>by {review.author || review.ownerName || 'Unknown'}</p>
                      </div>
                    </div>
                    <div className="review-meta">
                      <span
                        className="difficulty-badge"
                        style={{ backgroundColor: getDifficultyColor(review.difficulty) }}
                      >
                        {review.difficulty}
                      </span>
                      <span className="category-badge">{review.category}</span>
                    </div>
                  </div>

                  <div className="review-content">
                    <p>{review.description}</p>
                    {review.codeSnippet && (
                      <div className="code-preview">
                        <code>{review.codeSnippet}</code>
                      </div>
                    )}
                  </div>

                  <div className="review-footer">
                    <div className="review-stats">
                      <span className="time-ago">{formatTimeAgo(review.submittedAt || review.createdAt)}</span>
                      <span className="reviews-count">
                        {review.reviewsCount ?? review.reviews_received ?? 0}/{review.maxReviews ?? review.reviews_required ?? 3} reviews
                      </span>
                    </div>

                    {review.needsReview || (review.reviewsCount ?? 0) < (review.maxReviews ?? 3) ? (
                      <button className="btn-primary" onClick={() => {
                        // navigate to review page if available
                        if (review.submissionId) window.location.href = `/peer-review/${review.submissionId}`;
                        else if (review.id) window.location.href = `/peer-review/${review.id}`;
                      }}>
                        Start Review
                      </button>
                    ) : (
                      <button className="btn-secondary" disabled>
                        Review Complete
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {filteredReviews.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">📝</div>
                  <h3>No submissions available</h3>
                  <p>Check back later for new submissions to review!</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'my-submissions' && (
        <div className="my-submissions-section">
          <div className="section-header">
            <h2>Your Submissions</h2>
            <button className="btn-primary" onClick={() => window.location.href = '/submissions/new'}>
              Submit New Work
            </button>
          </div>

          {loading ? (
            <LoadingSpinner message="Loading your submissions..." />
          ) : error ? (
            <div className="error-state">
              <h3>Unable to load your submissions</h3>
              <p>{error}</p>
              <button className="btn-secondary" onClick={() => loadData({ category: selectedCategory })}>Retry</button>
            </div>
          ) : (
            <div className="submissions-list">
              {mySubmissions.map((submission) => (
                <div key={submission.id || submission.submissionId} className="submission-card">
                  <div className="submission-header">
                    <div className="submission-info">
                      <h4>{submission.title}</h4>
                      <div className="submission-meta">
                        <span className="category-badge">{submission.category}</span>
                        <span
                          className="difficulty-badge"
                          style={{ backgroundColor: getDifficultyColor(submission.difficulty) }}
                        >
                          {submission.difficulty}
                        </span>
                        {getStatusBadge(submission.status)}
                      </div>
                    </div>
                    <div className="submission-actions">
                      <button className="btn-secondary" onClick={() => window.location.href = `/submissions/${submission.id || submission.submissionId}`}>View Details</button>
                    </div>
                  </div>

                  <div className="submission-stats">
                    <div className="stat-item">
                      <strong>{submission.reviewsReceived ?? submission.reviews_received ?? 0}</strong>
                      <span>Reviews Received</span>
                    </div>
                    <div className="stat-item">
                      <strong>{submission.averageRating ?? submission.avg_rating ?? '—'}</strong>
                      <span>Average Rating</span>
                    </div>
                    <div className="stat-item">
                      <strong>{formatTimeAgo(submission.submittedAt || submission.createdAt)}</strong>
                      <span>Submitted</span>
                    </div>
                  </div>

                  {submission.feedback && (
                    <div className="latest-feedback">
                      <h5>Latest Feedback:</h5>
                      <p>"{submission.feedback}"</p>
                    </div>
                  )}

                  <div className="progress-bar">
                    <div className="progress-label">
                      Review Progress: {submission.reviewsReceived ?? submission.reviews_received ?? 0}/{submission.maxReviews ?? submission.reviews_required ?? 3}
                    </div>
                    <div className="progress-track" style={{ background: '#f3f4f6', borderRadius: 8, height: 8, overflow: 'hidden' }}>
                      <div
                        className="progress-fill"
                        style={{
                          width: `${((submission.reviewsReceived ?? submission.reviews_received ?? 0) / (submission.maxReviews ?? submission.reviews_required ?? 3)) * 100}%`,
                          background: '#3b82f6',
                          height: '100%',
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}

              {mySubmissions.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">📤</div>
                  <h3>No submissions yet</h3>
                  <p>Submit your first piece of work to get feedback from peers!</p>
                  <button className="btn-primary" onClick={() => window.location.href = '/submissions/new'}>Submit Your Work</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="review-tips">
        <h3>💡 Review Tips</h3>
        <div className="tips-grid">
          <div className="tip-card">
            <h4>Be Constructive</h4>
            <p>Focus on specific improvements and provide actionable feedback</p>
          </div>
          <div className="tip-card">
            <h4>Be Respectful</h4>
            <p>Remember there's a person behind the code. Be kind and encouraging</p>
          </div>
          <div className="tip-card">
            <h4>Be Specific</h4>
            <p>Point out exactly what works well and what could be improved</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PeerReviewPage;
