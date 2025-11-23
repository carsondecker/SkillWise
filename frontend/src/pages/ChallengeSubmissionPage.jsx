import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiService } from '../services/api';
import Lottie from 'lottie-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ballon_pop_confettie from '../assets/animations/ballon_pop_confettie.json'; // 👈 You’ll add this file
import { useAuth } from '../hooks/useAuth';
import { validateSubmission } from '../validation/submissionValidation';
import '../styles/ChallengeSubmissionPage.scss';

const fadeIn = {
  hidden: { opacity: 0, y: 15 },
  visible: (i = 1) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.4, ease: 'easeOut' },
  }),
};

const ChallengeSubmissionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [challenge, setChallenge] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submissionText, setSubmissionText] = useState('');
  const [file, setFile] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // 🔹 Fetch challenge details + past submissions
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [challengeRes, submissionsRes] = await Promise.all([
          apiService.challenges.getById(id),
          apiService.submissions.getForChallenge(id).catch((err) => {
            if (err.response?.status === 404)
              return { data: { submissions: [] } };
            throw err;
          }),
        ]);

        const challengeData = challengeRes.data.challenge || challengeRes.data;
        const submissionData = Array.isArray(submissionsRes.data)
          ? submissionsRes.data
          : submissionsRes.data.submissions || [];

        setChallenge(challengeData);
        console.log(challengeData);
        setSubmissions(submissionData);
      } catch (err) {
        console.error('Error fetching challenge details:', err);
        setSubmissions([]); // ensure always array
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, [id]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) setFile(selectedFile);
  };
  const attemptsLeft = challenge?.max_attempts
    ? Math.max(challenge.max_attempts - submissions.length, 0)
    : 1;

  // 🔹 Handle submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validation = validateSubmission({
      submission_text: submissionText,
      submission_files: file,
    });

    if (!validation.success) {
      alert(validation.error);
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('challengeId', id);
      formData.append('user_id', user.id);
      formData.append('submission_text', submissionText);
      if (file) formData.append('file', file);

      const res = await apiService.submissions.create(formData);

      const newSubmission = res.data?.submission || res.data || {};
      setSubmissions((prev) => [
        newSubmission,
        ...(Array.isArray(prev) ? prev : []),
      ]);

      setSubmissionText('');
      setFile(null);

      alert('✅ Submission successful!');
    } catch (err) {
      console.error('❌ Submission failed:', err);

      // Safely extract message + status
      const status = err.response?.status;
      const message =
        err.response?.data?.message ||
        err.message ||
        'An unexpected error occurred.';

      // 🧩 Handle specific server error
      if (status === 403 && message.includes('maximum number')) {
        alert(
          `⚠️ ${message}\n\nYou have reached your max allowed submissions for this challenge.`
        );
      } else if (status === 400) {
        alert(`⚠️ Validation error: ${message}`);
      } else if (status === 404) {
        alert(`❌ Challenge not found.`);
      } else if (status === 500) {
        // Detect backend MAX_ATTEMPTS_REACHED or other known errors
        if (
          message.includes('MAX_ATTEMPTS_REACHED') ||
          message.includes('maximum number')
        ) {
          alert(
            `⚠️ You’ve reached the maximum number of submissions allowed for this challenge.`
          );
        } else {
          alert(
            `🚨 Server error occurred (500).\nPlease try again later or contact support.`
          );
        }
      } else {
        alert(`⚠️ ${message}`);
      }
    } finally {
      setSubmitting(false);
    }
  };
  const handleSubmitForPeerReview = async () => {
    if (!window.confirm("Submit this challenge for peer review?")) return;

    try {
      const res = await apiService.challenges.submitForPeerReview(id);

      alert("🔍 Challenge submitted for peer review!");

      setChallenge((prev) => ({
        ...prev,
        status: res.data.challenge.status || "in_peer_review",
      }));
    } catch (err) {
      console.error("❌ Failed to submit for peer review", err);
      const msg = err.response?.data?.message || "Something went wrong.";
      alert(`⚠️ ${msg}`);
    }
  };
  const handleMarkAsComplete = async () => {
    if (!window.confirm('Mark this challenge as complete?')) return;

    try {
      const res = await apiService.challenges.markAsComplete(id);
      alert('✅ Challenge marked as complete!');
      // Update the challenge in state
      setChallenge((prev) => ({
        ...prev,
        status: res.data.challenge.status || 'completed',
      }));
      // 🎉 Trigger celebration animation
      setShowCelebration(true);

      // Auto-hide animation after 3.5s (or how long lottie runs)
      setTimeout(() => {
        setShowCelebration(false);
      }, 3000);
    } catch (err) {
      console.error('❌ Failed to mark challenge as complete:', err);
      const msg =
        err.response?.data?.message ||
        'Something went wrong while marking complete.';
      alert(`⚠️ ${msg}`);
    }
  };
  const isCompleted = challenge?.status === "completed";
  const isInPeerReview = challenge?.status === "in_peer_review";

  if (loading) return <LoadingSpinner message="Loading challenge..." />;

  if (!challenge)
    return (
      <div className="challenge-page-empty">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3>Challenge not found</h3>
          <button
            className="btn-secondary"
            onClick={() => navigate('/challenges')}
          >
            ← Back to Challenges
          </button>
        </motion.div>
      </div>
    );

  return (
    <motion.div
      className="challenge-submission-page"
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      {showCelebration && (
        <div className="celebration-overlay">
          <Lottie
            animationData={ballon_pop_confettie}
            loop={false}
            autoplay={true}
            background="transparent"
            speed={2}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      )}
      {/* Header */}
      <motion.div className="challenge-header" variants={fadeIn}>
        <motion.div
          className="back-btn"
          whileHover={{ x: -3, color: '#1e40af' }}
          onClick={() => navigate('/challenges')}
        >
          ← Back
        </motion.div>

        <div className="header-content gradient-card">
          <h1>{challenge.title}</h1>
          {challenge.status === 'completed' && (
            <span className="badge completed">🎯 Completed</span>
          )}
          <p className="description">{challenge.description}</p>

          <div className="meta">
            <span className={`badge ${challenge.difficulty_level}`}>
              {challenge.difficulty_level}
            </span>
            <span>🏆 {challenge.points_reward} pts</span>
            {challenge.estimated_time_minutes && (
              <span>⏱️ {challenge.estimated_time_minutes} min</span>
            )}
            {challenge.requires_peer_review && (
              <span className="badge peer-review">
                🔍 Requires Peer Review
              </span>
            )}

            {/* 🧮 Attempts Left */}
            {challenge.max_attempts && (
              <span
                className={`attempts-left ${
                  submissions.length >= challenge.max_attempts
                    ? 'no-attempts'
                    : ''
                }`}
              >
                🎯 Attempts Left:{' '}
                <strong>
                  {Math.max(challenge.max_attempts - submissions.length, 0)} /{' '}
                  {challenge.max_attempts}
                </strong>
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Instructions */}
      <motion.section className="instructions-card" variants={fadeIn}>
        <h2>📘 Instructions</h2>
        <p>{challenge.instructions}</p>

        {Array.isArray(challenge.learning_objectives) &&
          challenge.learning_objectives.length > 0 && (
            <div className="objectives">
              <h3>🎯 Learning Objectives</h3>
              <ul>
                {challenge.learning_objectives.map((obj, i) => (
                  <motion.li key={i} whileHover={{ x: 4 }}>
                    {obj}
                  </motion.li>
                ))}
              </ul>
            </div>
          )}
      </motion.section>

      {/* Submission Form */}
      <motion.section className={`submission-section ${isCompleted ? 'locked' : ''}`} variants={fadeIn}>
        <h2>✏️ Submit Your Solution</h2>
        {isCompleted ? (
          <p className="completed-text">🎉 This challenge is completed! No more submissions can be made.</p>
        ) : isInPeerReview ? (
          <p className="peer-review-text">🔍 This challenge is currently under peer review. You cannot submit new work at this time.</p>
        ) : (
          <form onSubmit={handleSubmit} encType="multipart/form-data">
          {/* Textarea */}
          <motion.textarea
            rows="10"
            placeholder="Write your solution, notes, or explanation here..."
            value={submissionText}
            onChange={(e) => setSubmissionText(e.target.value)}
            whileFocus={{ scale: 1.005 }}
            className="submission-textarea"
          />

          {/* File Upload */}
          <div className="file-upload-area">
            <label className="upload-box">
              <input type="file" onChange={handleFileChange} hidden />
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="upload-content"
              >
                📎{' '}
                {file
                  ? `Selected: ${file.name}`
                  : 'Drag or drop your file here'}
              </motion.div>
            </label>

            <button
              type="button"
              className="upload-btn"
              onClick={() =>
                document.querySelector('input[type="file"]').click()
              }
            >
              Choose File
            </button>
          </div>

          <div className="actions">
            <motion.button
              type="submit"
              className="btn-primary"
              disabled={submitting || attemptsLeft <= 0}
              whileHover={{ scale: attemptsLeft > 0 ? 1.05 : 1 }}
              whileTap={{ scale: attemptsLeft > 0 ? 0.95 : 1 }}
            >
              {submitting
                ? 'Submitting...'
                : attemptsLeft <= 0
                ? '🔒 No Attempts Left'
                : 'Submit Challenge'}
            </motion.button>
          </div>
        </form>
        )}
      </motion.section>

      {/* Submissions History */}
      <motion.section className="submissions-history" variants={fadeIn}>
        <h2>📜 Past Submissions</h2>
        {/* If challenge requires peer review */}
        {challenge.requires_peer_review ? (
          submissions.length > 0 &&
          challenge.status !== "submitted_for_peer_review" && (
            <motion.div className="mark-complete-container">
              <motion.button
                className="btn-primary"
                onClick={handleSubmitForPeerReview}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                🔍 Submit for Peer Review
              </motion.button>
            </motion.div>
          )
        ) : (
          /* Normal completion flow */
          !isCompleted && !isInPeerReview &&
          submissions.length > 0 && (
            <motion.div className="mark-complete-container">
              <motion.button
                className="btn-success"
                onClick={handleMarkAsComplete}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ✅ Mark Challenge as Complete
              </motion.button>
            </motion.div>
          )
        )}

        {submissions.length > 0 ? (
          <motion.table
            className="submissions-table"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <thead>
              <tr>
                <th>Attempt #</th>
                <th>Status</th>
                <th>Score</th>
                <th>File</th>
                <th>Submitted At</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s, i) => {
                // Parse the JSONB column safely
                let fileMeta = null;
                try {
                  if (typeof s.submission_files === 'string') {
                    fileMeta = JSON.parse(s.submission_files);
                  } else if (
                    typeof s.submission_files === 'object' &&
                    s.submission_files !== null
                  ) {
                    fileMeta = s.submission_files;
                  }
                } catch (err) {
                  fileMeta = null;
                }

                return (
                  <motion.tr
                    key={s.id || i}
                    whileHover={{ backgroundColor: '#f9fafb' }}
                  >
                    <td>{s.attempt_number}</td>
                    <td>
                      <span className={`status ${s.status}`}>{s.status}</span>
                    </td>
                    <td>{s.score ?? '—'}</td>

                    {/* 🧾 File column */}
                    <td>
                      {fileMeta && fileMeta.url ? (
                        <a
                          href={`${
                            process.env.REACT_APP_BACKEND_URL ||
                            'http://localhost:3001'
                          }${fileMeta.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="file-link"
                        >
                          📎 {fileMeta.original_name || 'View File'}
                        </a>
                      ) : (
                        <span className="no-file">No file</span>
                      )}
                    </td>

                    <td>
                      {new Date(s.submitted_at).toLocaleString([], {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </motion.table>
        ) : (
          <motion.p
            className="no-submissions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            No submissions yet. Be the first!
          </motion.p>
        )}
      </motion.section>
    </motion.div>
  );
};

export default ChallengeSubmissionPage;
