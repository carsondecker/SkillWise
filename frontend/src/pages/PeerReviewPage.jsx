// TODO: Implement peer review and collaboration features
import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/api';
import '../styles/PeerReviewPage.scss';

const PeerReviewPage = () => {
  const [reviews, setReviews] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [aiLoading, setAiLoading] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('review-others');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { user } = useAuth();

  // Mapping helpers used both for initial fetch and updates
  const mapAssignment = (item) => {
    return {
      id: item.id || item.submission_id || item.submissionId,
      title:
        item.challenge_title || item.title ||
        (item.submission_preview
          ? item.submission_preview.substring(0, 80)
          : item.submission_text
          ? item.submission_text.substring(0, 80)
          : 'Submission'),
      author: item.reviewee_name || item.author || item.user_name || 'Unknown',
      authorAvatar: item.authorAvatar || '',
      category: item.category || 'General',
      difficulty: item.difficulty || 'Beginner',
      description: item.submission_text || item.description || '',
      codeSnippet: (item.submission_text || '').substring(0, 400),
      submittedAt: item.submitted_at || item.created_at || item.submittedAt,
      needsReview: item.is_completed === false || item.status === 'submitted' || !!item.needsReview,
      reviewsCount: item.reviews_count || item.reviewsReceived || 0,
      maxReviews: item.max_reviews || 3,
    };
  };

  const mapSubmission = (s) => {
    return {
      id: s.id,
      title: s.challenge_title || (s.submission_text || '').substring(0, 60) || 'Submission',
      category: s.category || 'General',
      difficulty: s.difficulty || 'Beginner',
      status: s.status || 'submitted',
      feedback: s.feedback || null,
      peerReviewsReceived: s.peer_reviews_count || s.reviews_count || s.reviewsReceived || 0,
      aiFeedbackCount: s.ai_feedback_count || 0,
      latestAiFeedback: s.latest_ai_feedback || null,
      maxReviews: s.max_reviews || 3,
      averageRating: s.score || null,
      submittedAt: s.submitted_at || s.created_at || s.submittedAt,
      submission_text: s.submission_text,
    };
  };

  // Fetch review queue and user's submissions from API
  useEffect(() => {
    let cancelled = false;

    // Listen for created reviews so we can update counts optimistically
    const onReviewCreated = (e) => {
      try {
        const { submissionId, reviews_count } = e.detail || {};
        if (!submissionId) return;
        setMySubmissions((list) =>
          list.map((it) =>
            it.id === submissionId ? { ...it, reviewsReceived: Number(reviews_count) || it.reviewsReceived } : it,
          ),
        );
        setReviews((list) =>
          list.map((it) => (it.id === submissionId ? { ...it, reviewsCount: Number(reviews_count) || it.reviewsCount } : it)),
        );
      } catch (err) {
        console.error('Error handling peerReview:created event', err);
      }
    };
    window.addEventListener('peerReview:created', onReviewCreated);

    const fetchData = async () => {
      setLoading(true);

      try {
        const [queueRes, mySubsRes] = await Promise.all([
          apiService.peerReview.getReviewQueue().catch((e) => {
            console.error('Failed to fetch review queue', e);
            return { data: [] };
          }),
          // Use the submissions endpoint with the current user's id
          user?.id
            ? apiService.peerReview.getMySubmissions(user.id).catch((e) => {
                console.error('Failed to fetch my submissions', e);
                return { data: [] };
              })
            : Promise.resolve({ data: [] }),
        ]);

        if (cancelled) return;

        // Build queueData from several possible shapes
        let rawQueue = [];
        if (!queueRes || !queueRes.data) rawQueue = [];
        else if (Array.isArray(queueRes.data)) rawQueue = queueRes.data;
        else if (Array.isArray(queueRes.data.assignments)) rawQueue = queueRes.data.assignments;
        else if (Array.isArray(queueRes.data.submissions)) rawQueue = queueRes.data.submissions;

        // Build my submissions from several possible shapes
        let rawSubs = [];
        if (!mySubsRes || !mySubsRes.data) rawSubs = [];
        else if (Array.isArray(mySubsRes.data)) rawSubs = mySubsRes.data;
        else if (Array.isArray(mySubsRes.data.submissions)) rawSubs = mySubsRes.data.submissions;
        else if (Array.isArray(mySubsRes.data.items)) rawSubs = mySubsRes.data.items;

        const normalizedQueue = rawQueue.map(mapAssignment);
        const normalizedSubs = rawSubs.map(mapSubmission);

        setReviews(normalizedQueue);
        setMySubmissions(normalizedSubs);
      } catch (err) {
        console.error('Error fetching peer review data', err);
        setReviews([]);
        setMySubmissions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
      window.removeEventListener('peerReview:created', onReviewCreated);
    };
  }, []);

  const filteredReviews = reviews.filter((review) =>
    selectedCategory === 'all'
      ? true
      : (review.category || 'all').toLowerCase() === selectedCategory.toLowerCase()
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

  return (
    <div className="peer-review-page">
      <div className="page-header">
        <h1>Peer Review</h1>
        <p>Collaborate with fellow learners and improve together</p>
      </div>

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
                            review.difficulty
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
                              submission.difficulty
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
                      {/* AI Feedback button: show when there's no feedback yet */}
                      {!submission.feedback && (
                        <button
                          className="btn-primary"
                          disabled={!!aiLoading[submission.id]}
                          onClick={async () => {
                            try {
                              setAiLoading((s) => ({ ...s, [submission.id]: true }));
                              const res = await apiService.ai.generateFeedback({ submission_id: submission.id });
                              // The backend returns { message, submission }
                              const updated = res.data && (res.data.submission || res.data.submission || res.data);
                              if (updated) {
                                // Normalize and replace in state
                                const norm = (function mapSubmissionLocal(s) {
                                  return {
                                    id: s.id,
                                    title: s.challenge_title || (s.submission_text || '').substring(0, 60) || 'Submission',
                                    category: s.category || 'General',
                                    difficulty: s.difficulty || 'Beginner',
                                    status: s.status || 'submitted',
                                    feedback: s.feedback || null,
                                    reviewsReceived: s.reviews_count || s.reviewsReceived || 0,
                                    maxReviews: s.max_reviews || 3,
                                    averageRating: s.score || null,
                                    submittedAt: s.submitted_at || s.created_at || s.submittedAt,
                                    submission_text: s.submission_text,
                                  };
                                })(updated);

                                setMySubmissions((list) => list.map((it) => (it.id === norm.id ? norm : it)));
                              }
                            } catch (err) {
                              console.error('AI feedback request failed', err);
                              // Optionally show toast/notification
                            } finally {
                              setAiLoading((s) => ({ ...s, [submission.id]: false }));
                            }
                          }}
                        >
                          {aiLoading[submission.id] ? 'Generating...' : 'Get AI Feedback'}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="submission-stats">
                    <div className="stat-item">
                      <strong>{submission.peerReviewsReceived}</strong>
                      <span>Peer Reviews</span>
                    </div>
                    <div className="stat-item">
                      <strong>{submission.aiFeedbackCount}</strong>
                      <span>AI Feedback</span>
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

                  {submission.latestAiFeedback && (
                    <div className="latest-ai-feedback">
                      <h5>AI Feedback:</h5>
                      <p>"{submission.latestAiFeedback}"</p>
                    </div>
                  )}

                  {submission.feedback && (
                    <div className="latest-feedback">
                      <h5>Latest Peer Feedback:</h5>
                      <p>"{submission.feedback}"</p>
                    </div>
                  )}

                  <div className="progress-bar">
                    <div className="progress-label">
                      Peer Review Progress: {submission.peerReviewsReceived}/
                      {submission.maxReviews}
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${
                            (submission.peerReviewsReceived /
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
                  <p>Submit your first piece of work to get feedback from peers!</p>
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
