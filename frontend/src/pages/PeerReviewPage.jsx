// TODO: Implement peer review and collaboration features
import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import '../styles/components/dashboard/PeerReviewPage.scss';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/api';
import { useLayout } from '../contexts/LayoutContext';

const PeerReviewPage = () => {
  const [reviews, setReviews] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('review-others');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { user } = useAuth();
  const { setTitle, setSubtitle } = useLayout();

  // Load peer review queue and user's submissions from backend
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const [queueRes, mineRes] = await Promise.all([
          apiService.peerReview.getReviewQueue({ category: selectedCategory }),
          apiService.peerReview.getMySubmissions(),
        ]);

        if (!mounted) return;

        const queue = queueRes.data?.reviews || queueRes.data || [];
        const mine = mineRes.data?.submissions || mineRes.data || [];

        setReviews(queue);
        setMySubmissions(mine);
      } catch (error) {
        console.error('Failed to load peer review data:', error);
        if (!mounted) return;
        setReviews([]);
        setMySubmissions([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [selectedCategory]);

  const filteredReviews = reviews.filter(
    (review) =>
      selectedCategory === 'all' ||
      review.category.toLowerCase() === selectedCategory.toLowerCase(),
  );

  const getStatusBadge = (status) => {
    const statusConfig = {
      'under-review': { text: 'Under Review', className: 'status-pending' },
      completed: { text: 'Completed', className: 'status-completed' },
      'needs-revision': { text: 'Needs Revision', className: 'status-warning' },
    };
    const config = statusConfig[status] || {
      text: status,
      className: 'status-default',
    };
    return (
      <span className={`status-badge ${config.className}`}>{config.text}</span>
    );
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      Beginner: '#4CAF50',
      Intermediate: '#FF9800',
      Advanced: '#F44336',
    };
    return colors[difficulty] || '#757575';
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  useEffect(() => {
    setTitle('Peer Review');
    setSubtitle('Collaborate with fellow learners and improve together');
  }, []);

  return (
    <div className="peer-review-page">
      <div className="review-tabs">
        <button
          className={`tab-button ${
            activeTab === 'review-others' ? 'active' : ''
          }`}
          onClick={() => setActiveTab('review-others')}
        >
          Review Others ({reviews.filter((r) => r.needsReview).length})
        </button>
        <button
          className={`tab-button ${
            activeTab === 'my-submissions' ? 'active' : ''
          }`}
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
          ) : (
            <div className="reviews-grid">
              {filteredReviews.map((review) => (
                <div key={review.id} className="review-card">
                  <div className="review-header">
                    <div className="author-info">
                      <span className="author-avatar">
                        {review.authorAvatar}
                      </span>
                      <div>
                        <h4>{review.title}</h4>
                        <p>by {review.author}</p>
                      </div>
                    </div>
                    <div className="review-meta">
                      <span
                        className="difficulty-badge"
                        style={{
                          backgroundColor: getDifficultyColor(
                            review.difficulty,
                          ),
                        }}
                      >
                        {review.difficulty}
                      </span>
                      <span className="category-badge">{review.category}</span>
                    </div>
                  </div>

                  <div className="review-content">
                    <p>{review.description}</p>
                    <div className="code-preview">
                      <code>{review.codeSnippet}</code>
                    </div>
                  </div>

                  <div className="review-footer">
                    <div className="review-stats">
                      <span className="time-ago">
                        {formatTimeAgo(review.submittedAt)}
                      </span>
                      <span className="reviews-count">
                        {review.reviewsCount}/{review.maxReviews} reviews
                      </span>
                    </div>

                    {review.needsReview ? (
                      <button className="btn-primary">Start Review</button>
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
            <button className="btn-primary">Submit New Work</button>
          </div>

          {loading ? (
            <LoadingSpinner message="Loading your submissions..." />
          ) : (
            <div className="submissions-list">
              {mySubmissions.map((submission) => (
                <div key={submission.id} className="submission-card">
                  <div className="submission-header">
                    <div className="submission-info">
                      <h4>{submission.title}</h4>
                      <div className="submission-meta">
                        <span className="category-badge">
                          {submission.category}
                        </span>
                        <span
                          className="difficulty-badge"
                          style={{
                            backgroundColor: getDifficultyColor(
                              submission.difficulty,
                            ),
                          }}
                        >
                          {submission.difficulty}
                        </span>
                        {getStatusBadge(submission.status)}
                      </div>
                    </div>
                    <div className="submission-actions">
                      <button className="btn-secondary">View Details</button>
                    </div>
                  </div>

                  <div className="submission-stats">
                    <div className="stat-item">
                      <strong>{submission.reviewsReceived}</strong>
                      <span>Reviews Received</span>
                    </div>
                    <div className="stat-item">
                      <strong>{submission.averageRating}</strong>
                      <span>Average Rating</span>
                    </div>
                    <div className="stat-item">
                      <strong>{formatTimeAgo(submission.submittedAt)}</strong>
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
                      Review Progress: {submission.reviewsReceived}/
                      {submission.maxReviews}
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${
                            (submission.reviewsReceived /
                              submission.maxReviews) *
                            100
                          }%`,
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
                  <p>
                    Submit your first piece of work to get feedback from peers!
                  </p>
                  <button className="btn-primary">Submit Your Work</button>
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
            <p>
              Focus on specific improvements and provide actionable feedback
            </p>
          </div>
          <div className="tip-card">
            <h4>Be Respectful</h4>
            <p>
              Remember there's a person behind the code. Be kind and encouraging
            </p>
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
