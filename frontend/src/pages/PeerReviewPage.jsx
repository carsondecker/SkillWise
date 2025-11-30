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
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [activeAssignment, setActiveAssignment] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, feedback: '' });
  const [activeAssignmentDetails, setActiveAssignmentDetails] = useState(null);
  const [activeChallengeDetails, setActiveChallengeDetails] = useState(null);
  const [showSubmissionDetail, setShowSubmissionDetail] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [activeGoalDetails, setActiveGoalDetails] = useState(null);
  const [activeGoalId, setActiveGoalId] = useState(null);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [peerReviewCache, setPeerReviewCache] = useState({});
  const [submissionScores, setSubmissionScores] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { user } = useAuth();

  // Mapping helpers used both for initial fetch and updates
  const mapAssignment = (item) => {
    return {
      id: item.id || item.submission_id || item.submissionId,
      // Prefer the challenge title (not the submission text) for assignment title
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
      reviewsCount: item.peer_reviews_count || item.reviews_count || item.reviewsReceived || 0,
      maxReviews: item.max_reviews || 3,
      // preserve challenge context if available on the assignment row
      challenge_id: item.challenge_id || item.challengeId || item.challenge || null,
      challenge_title: item.challenge_title || item.title || null,
      challenge_description: item.challenge_description || item.description || null,
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

  const isUuid = (val) => {
    return typeof val === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(val);
  };

  // Fetch review queue and user's submissions from API
  useEffect(() => {
    let cancelled = false;

    // Listen for created reviews so we can update counts optimistically
    const onReviewCreated = (e) => {
      try {
        const { submissionId, peer_reviews_count, ai_feedback_count } = e.detail || {};
        if (!submissionId) return;
        setMySubmissions((list) =>
          list.map((it) =>
            it.id === submissionId
              ? { ...it, peerReviewsReceived: Number(peer_reviews_count) || it.peerReviewsReceived, aiFeedbackCount: Number(ai_feedback_count) || it.aiFeedbackCount }
              : it,
          ),
        );
        // Remove assignment from review queue if we just reviewed it
        setReviews((list) => list.filter((it) => it.submission_id !== submissionId && it.id !== submissionId));
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

        // After loading submissions, fetch all peer reviews for each submission
        try {
          const promises = normalizedSubs.map(async (s) => {
            if (!s || !s.id) return null;
            try {
              const res = await apiService.peerReview.getForSubmission(s.id).catch(() => ({ data: { reviews: [] } }));
              const reviews = (res && (res.data && (res.data.reviews || res.data))) || [];

              // compute peer average
              const peerCount = reviews.length;
              const peerSum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
              const peerAvg = peerCount > 0 ? peerSum / peerCount : null;

              // derive AI rating from submission.score (0-100) if present
              const aiScore100 = s.averageRating || s.score || null;
              const aiRating = typeof aiScore100 === 'number' ? Math.round((aiScore100 / 100) * 4 + 1) : null;

              // combined average: include AI as one data point if available
              const combinedCount = peerCount + (aiRating ? 1 : 0);
              const combinedSum = (peerSum || 0) + (aiRating || 0);
              const combined = combinedCount > 0 ? combinedSum / combinedCount : undefined;

              return { id: s.id, reviews, peerAvg, aiRating, combined, peerCount };
            } catch (err) {
              return { id: s.id, error: err?.message || String(err) };
            }
          });

          const results = await Promise.all(promises);
          const scoresMap = {};
          const reviewCacheUpdates = {};
          (results || []).forEach((r) => {
            if (!r) return;
            if (r.error) {
              scoresMap[r.id] = { error: r.error };
            } else {
              scoresMap[r.id] = { peerAvg: r.peerAvg, aiRating: r.aiRating, combined: r.combined, peerCount: r.peerCount };
              if (r.reviews && r.reviews.length) reviewCacheUpdates[r.id] = { loading: false, review: r.reviews[0] };
            }
          });

          setSubmissionScores((s) => ({ ...s, ...scoresMap }));
          setPeerReviewCache((c) => ({ ...c, ...reviewCacheUpdates }));
        } catch (err) {
          console.debug('Failed to batch fetch submission reviews', err?.message || err);
        }
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
  }, [user?.id]);

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
          Review Others ({reviews.length})
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

                      <button
                        className="btn-primary"
                        onClick={async () => {
                          // Prepare modal state
                          setActiveAssignment(review);
                          setReviewForm({ rating: 5, feedback: '' });
                          setActiveAssignmentDetails(null);
                          setActiveChallengeDetails(null);
                          setFetchError(null);
                          setFetchingDetails(true);
                          setReviewFormOpen(true);

                          try {
                            const submissionId = review.submission_id || review.id;

                            if (isUuid(submissionId)) {
                              try {
                                const subRes = await apiService.submissions.getById(submissionId);
                                console.debug('Fetched submission response:', subRes && subRes.data);
                                const sub = subRes && subRes.data && (subRes.data.submission || subRes.data);
                                setActiveAssignmentDetails(sub || null);

                                const cid = sub && (sub.challenge_id || sub.challengeId || sub.challenge);
                                if (cid !== undefined && cid !== null) {
                                  try {
                                    const chRes = await apiService.challenges.getById(cid);
                                    const ch = chRes && chRes.data && (chRes.data.challenge || chRes.data);
                                    setActiveChallengeDetails(ch || null);
                                    if (ch) {
                                      const gid = ch.goal_id || ch.goalId || ch.goal;
                                      if (gid !== undefined && gid !== null) setActiveGoalId(gid);
                                    }
                                  } catch (err) {
                                    console.error('Failed to fetch challenge details', err);
                                    setActiveChallengeDetails(null);
                                  }
                                }
                              } catch (err) {
                                console.error('Failed to fetch submission details', err);
                                setFetchError(err?.message || String(err));
                                setActiveAssignmentDetails(null);
                              }
                            } else {
                              // Fallback: use assignment payload for non-UUID ids
                              const fallback = {
                                id: review.id || review.submission_id || null,
                                submission_text: review.submission_text || review.description || review.codeSnippet || '',
                                challenge_id: review.challenge_id || review.challengeId || null,
                                challenge_title: review.challenge_title || review.title || null,
                                submission_files: review.submission_files || null,
                              };
                              setActiveAssignmentDetails(fallback);

                              const cid = review.challenge_id || review.challengeId || null;
                              if (cid !== null && cid !== undefined) {
                                try {
                                  const chRes = await apiService.challenges.getById(cid);
                                  const ch = chRes && chRes.data && (chRes.data.challenge || chRes.data);
                                  setActiveChallengeDetails(ch || null);
                                  if (ch) {
                                    const gid = ch.goal_id || ch.goalId || ch.goal;
                                    if (gid !== undefined && gid !== null) setActiveGoalId(gid);
                                  }
                                } catch (err) {
                                  console.debug('Could not fetch challenge for fallback id', cid, err?.message || err);
                                  setActiveChallengeDetails(null);
                                }
                              }
                            }
                          } catch (err) {
                            console.error('Unexpected error while preparing review modal', err);
                            setFetchError(err?.message || String(err));
                          } finally {
                            setFetchingDetails(false);
                          }
                        }}
                      >
                        Write Review
                      </button>
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

          {/* Review Form Modal */}
          {reviewFormOpen && activeAssignment && (
            <div
              className="modal-overlay"
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
              }}
            >
              <div
                className="modal"
                style={{
                  background: '#fff',
                  padding: 20,
                  borderRadius: 8,
                  maxWidth: '900px',
                  width: '95%',
                  maxHeight: '80%',
                  overflowY: 'auto',
                }}
              >
                <h3>Review: {activeAssignment.title}</h3>
                <p>Author: {activeAssignment.author}</p>
                <div className="modal-body">
                <div className="context-block">
                  <h4>
                    Challenge: {activeAssignmentDetails?.challenge_title || activeAssignment?.challenge_title || activeAssignment?.title || 'Unknown'}
                  </h4>
                  {(activeAssignmentDetails?.challenge_description || activeAssignment?.challenge_description) && (
                    <p>{activeAssignmentDetails?.challenge_description || activeAssignment?.challenge_description}</p>
                  )}
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button
                        className="btn-secondary"
                        onClick={() => setShowChallengeModal(true)}
                        style={{ padding: '6px 10px', borderRadius: 4 }}
                      >
                        View Challenge
                      </button>

                      <button
                        className="btn-secondary"
                        onClick={async () => {
                          // When opening goal modal, try to fetch goal via challenge -> goal
                          setFetchError(null);
                          setFetchingDetails(true);
                          setActiveGoalDetails(null);
                          try {
                            const cid = activeAssignmentDetails?.challenge_id || activeAssignment?.challenge_id || null;
                            let challenge = activeAssignmentDetails?.challenge || activeAssignment?.challenge || activeChallengeDetails;
                            if (!challenge && cid) {
                              const chRes = await apiService.challenges.getById(cid);
                              challenge = chRes && (chRes.data && (chRes.data.challenge || chRes.data));
                              // persist fetched challenge for later use
                              setActiveChallengeDetails(challenge || null);
                              if (challenge) {
                                const gid = challenge.goal_id || challenge.goalId || challenge.goal;
                                if (gid !== undefined && gid !== null) setActiveGoalId(gid);
                              }
                            }
                            const goalId = challenge && (challenge.goal_id || challenge.goalId || challenge.goal) || activeGoalId;
                            if (goalId) {
                              try {
                                const gRes = await apiService.goals.getById(goalId);
                                const g = gRes && (gRes.data && (gRes.data.goal || gRes.data));
                                setActiveGoalDetails(g || null);
                              } catch (gErr) {
                                console.error('Failed to fetch goal details', gErr);
                                setActiveGoalDetails(null);
                                setFetchError(gErr?.message || String(gErr));
                              }
                            } else {
                              setActiveGoalDetails(null);
                              setFetchError('No associated goal found for this challenge');
                            }
                            setShowGoalModal(true);
                          } catch (err) {
                            console.error('Failed to fetch challenge/goal for goal modal', err);
                            setFetchError(err?.message || String(err));
                            setShowGoalModal(true);
                          } finally {
                            setFetchingDetails(false);
                          }
                        }}
                        style={{ padding: '6px 10px', borderRadius: 4 }}
                      >
                        View Goal
                      </button>

                      <button
                        className="btn-secondary"
                        onClick={async () => {
                          // Ensure we have the latest full submission text by fetching the submission
                          setFetchError(null);
                          setFetchingDetails(true);
                          try {
                            const submissionId = (activeAssignmentDetails && (activeAssignmentDetails.id || activeAssignmentDetails.submission_id)) || activeAssignment.submission_id || activeAssignment.id || activeAssignment.submissionId;
                            if (!submissionId) {
                              setFetchError('No submission id available');
                              setShowSubmissionModal(true);
                              return;
                            }
                            const subRes = await apiService.submissions.getById(submissionId);
                            const sub = subRes && (subRes.data && (subRes.data.submission || subRes.data));
                            if (sub) {
                              setActiveAssignmentDetails(sub);
                            }
                            setShowSubmissionModal(true);
                          } catch (err) {
                            console.error('Failed to fetch submission for modal', err);
                            setFetchError(err?.message || String(err));
                            setShowSubmissionModal(true);
                          } finally {
                            setFetchingDetails(false);
                          }
                        }}
                        style={{ padding: '6px 10px', borderRadius: 4 }}
                      >
                        Show Submission
                      </button>
                    </div>
                </div>
                  <label>
                    Rating:
                    <select
                      value={reviewForm.rating}
                      onChange={(e) => setReviewForm((s) => ({ ...s, rating: Number(e.target.value) }))}
                    >
                      <option value={5}>5 - Excellent</option>
                      <option value={4}>4 - Good</option>
                      <option value={3}>3 - Okay</option>
                      <option value={2}>2 - Poor</option>
                      <option value={1}>1 - Very Poor</option>
                    </select>
                  </label>

                  <label>
                    Feedback:
                    <textarea
                      value={reviewForm.feedback}
                      onChange={(e) => setReviewForm((s) => ({ ...s, feedback: e.target.value }))}
                      placeholder="Provide constructive, specific feedback (max 2000 chars)"
                    />
                  </label>

                  <div className="modal-actions">
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        setReviewFormOpen(false);
                        setActiveAssignment(null);
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn-primary"
                      onClick={async () => {
                        try {
                          const computedSubmissionId =
                            (activeAssignmentDetails && (activeAssignmentDetails.id || activeAssignmentDetails.submission_id)) ||
                            activeAssignment.submission_id ||
                            activeAssignment.submissionId ||
                            (isUuid(activeAssignment.id) ? activeAssignment.id : null);

                          const payload = {
                            submissionId: computedSubmissionId,
                            rating: reviewForm.rating,
                            feedback: reviewForm.feedback,
                          };
                          const res = await apiService.peerReview.submitReview(payload);
                          // Optimistically remove the reviewed item from queue
                          setReviews((list) =>
                            list.filter((it) => it.submission_id !== payload.submissionId && it.id !== payload.submissionId),
                          );
                          // Update my submissions counts if backend returned the updated counts
                          if (res && res.data) {
                            const updatedPeer = res.data.peer_reviews_count || (res.data.review && res.data.review.peer_reviews_count);
                            const updatedAi = res.data.ai_feedback_count || (res.data.review && res.data.review.ai_feedback_count);
                            const sid = payload.submissionId;
                            setMySubmissions((list) =>
                              list.map((it) => (it.id === sid ? { ...it, peerReviewsReceived: updatedPeer || it.peerReviewsReceived, aiFeedbackCount: updatedAi || it.aiFeedbackCount } : it)),
                            );
                          }
                        } catch (err) {
                          console.error('Failed to submit review', err);
                          // Optionally show notification
                        } finally {
                          setReviewFormOpen(false);
                          setActiveAssignment(null);
                        }
                      }}
                    >
                      Submit Review
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Challenge modal */}
          {showChallengeModal && (
            <div
              className="modal-overlay"
              style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}
            >
              <div style={{ background: '#fff', padding: 20, borderRadius: 8, maxWidth: '900px', width: '95%', maxHeight: '80%', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>Challenge Details</h3>
                  <button className="btn-secondary" onClick={() => setShowChallengeModal(false)}>Close</button>
                </div>
                <div style={{ marginTop: 12 }}>
                  {fetchingDetails ? (
                    <div>Loading challenge...</div>
                  ) : fetchError ? (
                    <div style={{ color: 'var(--danger, #c00)' }}>Failed to load details: {fetchError}</div>
                  ) : (
                    <>
                      <h4>{activeChallengeDetails?.title || activeAssignment?.challenge_title || 'Challenge not available'}</h4>
                      <p>{activeChallengeDetails?.description || activeAssignment?.challenge_description || 'No challenge description available.'}</p>
                      {activeChallengeDetails?.instructions && (
                        <div>
                          <h5>Instructions</h5>
                          <pre style={{ whiteSpace: 'pre-wrap' }}>{activeChallengeDetails.instructions}</pre>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Goal modal */}
          {showGoalModal && (
            <div
              className="modal-overlay"
              style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}
            >
              <div style={{ background: '#fff', padding: 20, borderRadius: 8, maxWidth: '900px', width: '95%', maxHeight: '80%', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>Goal Details</h3>
                  <button className="btn-secondary" onClick={() => setShowGoalModal(false)}>Close</button>
                </div>
                <div style={{ marginTop: 12 }}>
                  {fetchingDetails ? (
                    <div>Loading goal...</div>
                  ) : fetchError ? (
                    <div style={{ color: 'var(--danger, #c00)' }}>Failed to load goal: {fetchError}</div>
                  ) : activeGoalDetails ? (
                    <>
                      <h4>{activeGoalDetails.title || 'Goal'}</h4>
                      <p>{activeGoalDetails.description || 'No goal description available.'}</p>
                      <div style={{ marginTop: 8 }}>
                        <a className="btn-secondary" href={`/goals/${activeGoalDetails.id}`} target="_blank" rel="noreferrer">Open Goal</a>
                      </div>
                    </>
                  ) : activeChallengeDetails && activeChallengeDetails.goal_id ? (
                    <div>
                      <h4>Goal: <a href={`/goals/${activeChallengeDetails.goal_id}`} target="_blank" rel="noreferrer">Open Goal</a></h4>
                    </div>
                  ) : (
                    <p>Goal details not available.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Submission modal */}
          {showSubmissionModal && (
            <div
              className="modal-overlay"
              style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}
            >
              <div style={{ background: '#fff', padding: 20, borderRadius: 8, maxWidth: '900px', width: '95%', maxHeight: '80%', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>Submission</h3>
                  <button className="btn-secondary" onClick={() => setShowSubmissionModal(false)}>Close</button>
                </div>
                <div style={{ marginTop: 12 }}>
                  <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{
                    (activeAssignmentDetails && (activeAssignmentDetails.submission_text || activeAssignmentDetails.content)) ||
                    (activeAssignment && (activeAssignment.description || activeAssignment.codeSnippet)) ||
                    'No submission text available'
                  }</pre>
                  {((activeAssignmentDetails && activeAssignmentDetails.submission_files) || (activeAssignment && activeAssignment.submission_files)) && (
                    <div style={{ marginTop: 12 }}>
                      {fetchingDetails ? (
                        <div>Loading submission...</div>
                      ) : fetchError ? (
                        <div style={{ color: 'var(--danger, #c00)' }}>Failed to load submission: {fetchError}</div>
                      ) : (
                        <>
                          <h4>Submission</h4>
                          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{
                            (activeAssignmentDetails && (activeAssignmentDetails.submission_text || activeAssignmentDetails.content)) ||
                            (activeAssignment && (activeAssignment.description || activeAssignment.codeSnippet)) ||
                            'No submission text available'
                          }</pre>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
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
                      <strong>
                        {submissionScores[submission.id] && typeof submissionScores[submission.id].combined !== 'undefined'
                          ? (Number(submissionScores[submission.id].combined).toFixed(1))
                          : 'N/A'}
                      </strong>
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

                  {/* AI feedback may also be stored under `feedback` depending on backend shape. Prefer `feedback` for AI feedback when present. */}
                  {submission.feedback && !submission.latestAiFeedback && (
                    <div className="latest-ai-feedback">
                      <h5>AI Feedback:</h5>
                      <p>"{submission.feedback}"</p>
                    </div>
                  )}

                  {/* Latest peer review section: fetch on demand */}
                  <div style={{ marginTop: 10 }}>
                    {peerReviewCache[submission.id] && peerReviewCache[submission.id].loading && (
                      <div>Loading latest peer review...</div>
                    )}

                    {peerReviewCache[submission.id] && peerReviewCache[submission.id].error && (
                      <div style={{ color: 'var(--danger, #c00)' }}>Failed to load latest peer review: {peerReviewCache[submission.id].error}</div>
                    )}

                    {peerReviewCache[submission.id] && peerReviewCache[submission.id].review && (
                      <div className="latest-feedback">
                        <h5>Latest Peer Feedback:</h5>
                        <p>"{peerReviewCache[submission.id].review.review_text}"</p>
                        <small>— {peerReviewCache[submission.id].review.first_name} {peerReviewCache[submission.id].review.last_name} • {new Date(peerReviewCache[submission.id].review.created_at).toLocaleString()}</small>
                      </div>
                    )}

                    {!peerReviewCache[submission.id] && (
                      <button
                        className="btn-secondary"
                        onClick={async () => {
                          try {
                            setPeerReviewCache((c) => ({ ...c, [submission.id]: { loading: true } }));
                            const res = await apiService.peerReview.getForSubmission(submission.id);
                            const reviews = res && res.data && (res.data.reviews || res.data);
                            const latest = Array.isArray(reviews) && reviews.length > 0 ? reviews[0] : null;
                            setPeerReviewCache((c) => ({ ...c, [submission.id]: { loading: false, review: latest } }));
                          } catch (err) {
                            setPeerReviewCache((c) => ({ ...c, [submission.id]: { loading: false, error: err?.message || String(err) } }));
                          }
                        }}
                      >
                        Load Latest Peer Review
                      </button>
                    )}
                  </div>

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
              {showSubmissionDetail && (
                <div className="submission-detail" style={{ marginTop: 12, padding: 8, background: '#fafafa', borderRadius: 6 }}>
                  <h4>Submission</h4>
                  <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{
                    (activeAssignmentDetails && (activeAssignmentDetails.submission_text || activeAssignmentDetails.content)) ||
                    (activeAssignment && (activeAssignment.description || activeAssignment.codeSnippet)) ||
                    'No submission text available'
                  }</pre>
                  {((activeAssignmentDetails && activeAssignmentDetails.submission_files) || (activeAssignment && activeAssignment.submission_files)) && (
                    <div style={{ marginTop: 8 }}>
                      <strong>Files:</strong>
                      <div>
                        {activeAssignmentDetails && activeAssignmentDetails.submission_files
                          ? (typeof activeAssignmentDetails.submission_files === 'string' ? activeAssignmentDetails.submission_files : JSON.stringify(activeAssignmentDetails.submission_files))
                          : (typeof activeAssignment?.submission_files === 'string' ? activeAssignment.submission_files : JSON.stringify(activeAssignment?.submission_files))}
                      </div>
                    </div>
                  )}
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
