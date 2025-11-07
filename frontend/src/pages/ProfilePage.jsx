import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/api';
import '../styles/ProfilePage.scss';

const ProfilePage = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const { user, updateProfile } = useAuth();

  // ✅ Fetch actual user profile + statistics from backend
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);

        // Parallel API calls for user and stats
        const [profileRes, statsRes] = await Promise.all([
          apiService.user.getProfile(),
          apiService.progress.getProgress(),
        ]);

        const userData = profileRes.data.user || profileRes.data;
        const statsData = statsRes.data.statistics || statsRes.data;

        // Merge backend user + stats
        const fullProfile = {
          id: userData.id,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          avatar: '👤',
          bio: userData.bio || '',
          location: userData.location || 'Not specified',
          website: userData.website || '',
          joinedDate: userData.createdAt || new Date().toISOString(),
          level: statsData.level || 1,
          totalPoints: statsData.total_points || 0,
          completedChallenges: statsData.completed_challenges || 0,
          goalsAchieved: statsData.goals_achieved || 0,
          currentStreak: statsData.current_streak || 0,
          longestStreak: statsData.longest_streak || 0,
          skills: statsData.skills || [],
          badges: statsData.badges || [],
          recentActivity: statsData.recent_activity || [],
          preferences: statsData.preferences || {
            emailNotifications: true,
            pushNotifications: false,
            weeklyDigest: true,
            publicProfile: true,
            showProgress: true,
          },
        };

        setProfileData(fullProfile);
        setFormData(fullProfile);
      } catch (error) {
        console.error('❌ Failed to load profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  // ✅ Handle input changes for both form fields & checkboxes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // ✅ Save profile updates via API
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updatePayload = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        bio: formData.bio,
        location: formData.location,
        website: formData.website,
      };

      const response = await apiService.user.updateProfile(updatePayload);

      setProfileData((prev) => ({
        ...prev,
        ...response.data.user,
      }));

      await updateProfile({
        firstName: response.data.user.first_name,
        lastName: response.data.user.last_name,
        bio: response.data.user.bio,
        location: response.data.user.location,
        website: response.data.user.website,
      });

      setIsEditing(false);
    } catch (error) {
      console.error('❌ Profile update failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    const icons = {
      challenge: '🏆',
      goal: '🎯',
      review: '👥',
      streak: '🔥',
    };
    return icons[type] || '📝';
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

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
              <p className="profile-bio">{profileData?.bio}</p>
              <div className="profile-meta">
                <span>📍 {profileData?.location}</span>
                <span>📅 Joined {formatDate(profileData?.joinedDate)}</span>
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
                <strong>{profileData?.currentStreak}</strong>
                <span>Day Streak</span>
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

      {/* Tabs */}
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

      {/* Content */}
      <div className="profile-content">
        {isEditing ? (
          <form onSubmit={handleSubmit} className="edit-profile-form">
            <div className="form-section">
              <h3>Personal Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName || ''}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName || ''}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio || ''}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="location">Location</label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location || ''}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="website">Website</label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    value={formData.website || ''}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="overview-tab">
                <div className="overview-grid">
                  <div className="recent-activity">
                    <h3>Recent Activity</h3>
                    {profileData?.recentActivity?.length > 0 ? (
                      <div className="activity-list">
                        {profileData.recentActivity.map((activity) => (
                          <div key={activity.id} className="activity-item">
                            <div className="activity-icon">
                              {getActivityIcon(activity.type)}
                            </div>
                            <div className="activity-info">
                              <h4>{activity.title}</h4>
                              <div className="activity-meta">
                                <span>{formatTimeAgo(activity.date)}</span>
                                <span className="points">
                                  +{activity.points} points
                                </span>
                              </div>
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
                        <strong>{profileData?.goalsAchieved}</strong>
                        <span>Goals Achieved</span>
                      </div>
                      <div className="achievement-stat">
                        <strong>{profileData?.longestStreak}</strong>
                        <span>Longest Streak</span>
                      </div>
                      <div className="achievement-stat">
                        <strong>
                          {profileData?.badges?.filter((b) => b.earned)
                            .length || 0}
                        </strong>
                        <span>Badges Earned</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
