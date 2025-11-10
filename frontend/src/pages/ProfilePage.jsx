import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/api';
import '../styles/ProfilePage.scss';

const ProfilePage = () => {
  const [profileData, setProfileData] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const { user, updateProfile } = useAuth();

  // ✅ Fetch profile + statistics + latest progress
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);

        const [profileRes, statsRes, progressRes] = await Promise.all([
          apiService.user.getProfile(),
          apiService.user.getStatistics(),
          apiService.progress.getLatestProgress(), // 👈 new API call
        ]);

        const userData = profileRes.data.user || profileRes.data;
        const statsData = statsRes.data.statistics || statsRes.data;
        const progressData = progressRes.data.latest || [];
        console.log(progressData);

        // ✅ Normalize progress for UI (latest 3 activities)
        // ✅ Normalize latest progress (works with camelCase API)
        const formattedActivity = progressData.map((p) => {
          const isChallenge = !!p.challengeId;
          const isGoal = !!p.goalId;

          return {
            id: p.id,
            type: isChallenge ? 'challenge' : isGoal ? 'goal' : 'progress',
            title: p.challengeTitle || p.goalTitle || 'Progress Update',
            date: p.updatedAt || p.createdAt,
            category: p.challengeDifficulty || p.goalCategory || '',
            points: p.pointsEarned || 10, // backend could include this later
            note:
              p.eventType === 'goal_completed'
                ? 'Goal completed!'
                : p.eventType === 'challenge_completed'
                ? 'Challenge finished!'
                : '',
          };
        });

        // ✅ Merge user data
        const fullProfile = {
          id: userData.id,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          avatar: userData.profileImage || '👤',
          bio: userData.bio || '',
          location: userData.location || 'Not specified',
          website: userData.website || '',
          joinedDate:
            userData.createdAt ||
            userData.joinedDate ||
            new Date().toISOString(),

          level: statsData.level || 1,
          totalPoints: Number(statsData.total_points || 0),
          completedChallenges: Number(
            statsData.total_challenges_completed || 0
          ),
          goalsAchieved: Number(statsData.total_goals_completed || 0),
          currentStreak: Number(statsData.current_streak_days || 0),
          longestStreak: Number(statsData.longest_streak_days || 0),

          badges: userData.badges || [],
          preferences: userData.preferences || {},
        };

        setProfileData(fullProfile);
        setRecentActivity(formattedActivity);
        setFormData(fullProfile);
      } catch (error) {
        console.error('❌ Failed to load profile:', error);
      } finally {
        setLoading(false);
      }
    };

    void fetchProfile();
  }, [user]);

  // ✅ Input handler
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // ✅ Save profile updates
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updatePayload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        bio: formData.bio,
        profileImage: formData.avatar,
      };

      const response = await apiService.user.updateProfile(updatePayload);

      setProfileData((prev) => ({
        ...prev,
        ...response.data.user,
      }));

      await updateProfile(response.data.user);
      setIsEditing(false);
    } catch (error) {
      console.error('❌ Profile update failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Helper: icons for activity
  const getActivityIcon = (type) => {
    const icons = {
      challenge: '🏆',
      goal: '🎯',
      review: '👥',
      streak: '🔥',
    };
    return icons[type] || '📝';
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  if (loading && !profileData) {
    return <LoadingSpinner message="Loading profile..." />;
  }

  return (
    <div className="profile-page">
      {/* HEADER */}
      <div className="profile-header">
        <div className="profile-banner">
          <div className="profile-info">
            <div className="profile-avatar">
              <span className="avatar-icon">{profileData?.avatar}</span>
              <div className="level-badge">Level {profileData?.level}</div>
            </div>

            <div className="profile-details">
              <h1>
                {profileData?.firstName} {profileData?.lastName}
              </h1>
              <p className="profile-bio">{profileData?.bio || 'No bio yet.'}</p>
              <div className="profile-meta">
                <span>📍 {profileData?.location}</span>
                <span>
                  📅 Joined{' '}
                  {new Date(profileData?.joinedDate).toLocaleDateString(
                    'en-US'
                  )}
                </span>
                {profileData?.website && (
                  <span>
                    🌐{' '}
                    <a
                      href={profileData.website}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {profileData.website}
                    </a>
                  </span>
                )}
              </div>
            </div>

            <div className="profile-stats">
              <div className="stat-item">
                <strong>{profileData?.totalPoints.toLocaleString()}</strong>
                <span>Total Points</span>
              </div>
              <div className="stat-item">
                <strong>{profileData?.completedChallenges}</strong>
                <span>Challenges</span>
              </div>
              <div className="stat-item">
                <strong>{profileData?.goalsAchieved}</strong>
                <span>Goals</span>
              </div>
            </div>

            <button
              className="btn-primary"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="profile-tabs">
        {['overview', 'skills', 'badges', 'settings'].map((tab) => (
          <button
            key={tab}
            className={`tab-button ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div className="profile-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="overview-grid">
              <div className="recent-activity">
                <h3>Recent Activity</h3>
                {recentActivity.length > 0 ? (
                  <div className="activity-list">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="activity-item">
                        <div className="activity-icon">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="activity-info">
                          <h4>{activity.title}</h4>
                          <div className="activity-meta">
                            <span>{formatTimeAgo(activity.date)}</span>
                            <span className="points">
                              +{activity.points} pts
                            </span>
                          </div>
                          {activity.note && (
                            <p className="activity-note">{activity.note}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No recent activity yet.</p>
                )}
              </div>

              <div className="achievements-summary">
                <h3>Achievements</h3>
                <div className="achievements-stats">
                  <div className="achievement-stat">
                    <strong>{profileData.goalsAchieved}</strong>
                    <span>Goals Achieved</span>
                  </div>
                  <div className="achievement-stat">
                    <strong>{profileData.longestStreak}</strong>
                    <span>Longest Streak</span>
                  </div>
                  <div className="achievement-stat">
                    <strong>
                      {profileData.badges?.filter((b) => b.earned).length || 0}
                    </strong>
                    <span>Badges Earned</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
