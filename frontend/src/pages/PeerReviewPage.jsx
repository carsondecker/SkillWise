import React, { useEffect, useState } from "react";
import PeerReviewCard from "../components/peerReview/PeerReviewCard";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { apiService } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import "../styles/PeerReviewPage.scss";
import { useNavigate } from "react-router-dom";


const PeerReviewPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("review-others");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Fetch data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [reviewTasks, mySubs] = await Promise.all([
          apiService.peerReview.getReviewQueue(),
          apiService.peerReview.getMySubmissions()
        ]);

        setReviews(reviewTasks.data.queue || []);
        setMySubmissions(mySubs.data.submissions || []);
        console.log(reviewTasks,mySubs);
      } catch (err) {
        console.error("Peer Review Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  const filteredReviews = reviews.filter(
    (r) =>
      selectedCategory === "all" ||
      r.category.toLowerCase() === selectedCategory.toLowerCase()
  );
  const handleViewMySubmission = (submission) => {
    navigate(`/challenges/${submission.challenge_id}/submit?mode=peer-review-view`);
  };
  const handleStartReview = (review) => {
    navigate(`/peer-review/${review.submission_id}`);
  };

  return (
    <div className="peer-review-page">
      <div className="page-header">
        <h1>Peer Review</h1>
        <p>Collaborate with fellow learners and improve together</p>
      </div>

      {/* ─── TABS ───────────────────────────────────── */}
      <div className="review-tabs">
        <button
          className={`tab-button ${activeTab === "review-others" ? "active" : ""}`}
          onClick={() => setActiveTab("review-others")}
        >
          Review Others <span className="tab-count">{filteredReviews.length}</span>
        </button>

        <button
          className={`tab-button ${activeTab === "my-submissions" ? "active" : ""}`}
          onClick={() => setActiveTab("my-submissions")}
        >
          My Submissions <span className="tab-count">{mySubmissions.length}</span>
        </button>
      </div>

      {/* ─── REVIEW OTHERS TAB ───────────────────────── */}
      {activeTab === "review-others" && (
        <div className="review-others-section">
          <div className="section-header">
            <h2>Help Others Improve</h2>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="react">React</option>
              <option value="javascript">JavaScript</option>
              <option value="css">CSS</option>
              <option value="algorithms">Algorithms</option>
              <option value="backend">Backend</option>
              <option value="database">Database</option>
            </select>
          </div>

          {loading ? (
            <LoadingSpinner message="Loading submissions..." />
          ) : (
            <div className="reviews-grid">
              {filteredReviews.map((review) => (
                <PeerReviewCard
                  key={review.submission_id}
                  review={review}
                  onStartReview={handleStartReview}
                />
              ))}

              {filteredReviews.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">📝</div>
                  <h3>No submissions available</h3>
                  <p>Check back later for new submissions.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── MY SUBMISSIONS TAB ───────────────────────── */}
      {activeTab === "my-submissions" && (
        <div className="my-submissions-section">
          <div className="section-header">
            <h2>Your Submissions</h2>
            <button className="btn-primary">Submit New Work</button>
          </div>

          {loading ? (
            <LoadingSpinner message="Loading your submissions..." />
          ) : (
            <div className="submissions-list">
              {mySubmissions.map((s) => (
                <div key={s.id} className="submission-card">
                  <div className="submission-header">
                    <div>
                      <h4>{s.challenge_title}</h4>
                      <div className="submission-meta">
                        <span className={`category-badge ${s.challenge_status === 'peer_reviewed'? 'peer-reviewed':''}`}>{s.challenge_status}</span>
                        <span className="difficulty-badge diff-medium">
                          {s.challenge_difficulty}
                        </span>
                      </div>
                    </div>
                    <button
                      className="btn-secondary"
                      onClick={() => handleViewMySubmission(s)}
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PeerReviewPage;
