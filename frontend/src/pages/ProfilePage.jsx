// TODO: Implement user profile management and settings
import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import '../styles/components/dashboard/ProfilePage.scss';
import { useAuth } from '../hooks/useAuth';
import { useLayout } from '../contexts/LayoutContext';

const ProfilePage = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const { user, updateProfile } = useAuth();

  // Fetch profile from backend when possible, fall back to a lightweight mock
  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      setLoading(true);

      try {
        // Try to get profile from backend
        const res = await fetch('/api/users/profile', {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Profile fetch failed');

        const data = await res.json();

        if (!mounted) return;

        const remoteProfile = data.user || data;
        setProfileData(remoteProfile);
        setFormData(remoteProfile);
      } catch (err) {
        // Fallback: use a light mock based on AuthContext user if backend unavailable
        const fallback = {
          id: user?.id || 1,
          firstName: user?.firstName || 'John',
          lastName: user?.lastName || 'Doe',
          email: user?.email || 'john.doe@example.com',
          avatar: '👤',
          bio: '',
          location: '',
          website: '',
          joinedDate: new Date().toISOString(),
          level: 1,
          totalPoints: 0,
          completedChallenges: 0,
          goalsAchieved: 0,
          currentStreak: 0,
          longestStreak: 0,
          badges: [],
          skills: [],
          recentActivity: [],
          preferences: {},
        };

        if (!mounted) return;
        setProfileData(fallback);
        setFormData(fallback);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProfile();

    return () => {
      mounted = false;
    };
  }, [user]);

  const { setTitle, setSubtitle } = useLayout();

  useEffect(() => {
    setTitle('Profile');
    setSubtitle('View and manage your personal information and preferences');
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prefer the AuthContext updateProfile if available
      if (updateProfile) {
        const result = await updateProfile(formData);
        if (result?.success) {
          setProfileData(formData);
          setIsEditing(false);
        } else {
          console.error('Profile update failed:', result?.error);
        }
      } else {
        // Fallback to direct API call
        const res = await fetch('/api/users/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(formData),
        });

        if (!res.ok) throw new Error('Profile update failed');

        const updated = await res.json();
        setProfileData(updated.user || updated);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
    <div className="profile-page">
      {loading && !profileData && (
        <div className="page-loading">
          <LoadingSpinner message="Loading profile..." />
        </div>
      )}
      <div className="profile-header">
        <div className="profile-banner">
          <div className="profile-info">
            <div className="profile-avatar">
              <span className="avatar-icon">{profileData?.avatar}</span>
              <div className="level-badge">Level {profileData?.level}</div>
            </div>

            <div className="profile-details">
              <h2>
                {profileData?.firstName} {profileData?.lastName}
              </h2>
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

      <div className="profile-tabs">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab-button ${activeTab === 'skills' ? 'active' : ''}`}
          onClick={() => setActiveTab('skills')}
        >
          Skills
        </button>
        <button
          className={`tab-button ${activeTab === 'badges' ? 'active' : ''}`}
          onClick={() => setActiveTab('badges')}
        >
          Badges
        </button>
        <button
          className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>

      <div className="profile-content">
        {isEditing && (
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
        )}

        {activeTab === 'overview' && !isEditing && (
          <div className="overview-tab">
            <div className="overview-grid">
              <div className="recent-activity">
                <h3>Recent Activity</h3>
                <div className="activity-list">
                  {profileData?.recentActivity.map((activity) => (
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
                      {profileData?.badges.filter((b) => b.earned).length}
                    </strong>
                    <span>Badges Earned</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'skills' && !isEditing && (
          <div className="skills-tab">
            <h3>Skill Progress</h3>
            <div className="skills-grid">
              {profileData?.skills.map((skill, index) => (
                <div key={index} className="skill-item">
                  <div className="skill-header">
                    <h4>{skill.name}</h4>
                    <span className="skill-category">{skill.category}</span>
                  </div>
                  <div className="skill-progress">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${skill.level}%` }}
                      ></div>
                    </div>
                    <span className="skill-level">{skill.level}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'badges' && !isEditing && (
          <div className="badges-tab">
            <h3>Badge Collection</h3>
            <div className="badges-grid">
              {profileData?.badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`badge-item ${badge.earned ? 'earned' : 'locked'}`}
                >
                  <div className="badge-icon">{badge.icon}</div>
                  <h4>{badge.name}</h4>
                  <p>{badge.description}</p>
                  {badge.earned ? (
                    <span className="badge-status earned">Earned ✓</span>
                  ) : (
                    <span className="badge-status locked">Locked 🔒</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && !isEditing && (
          <div className="settings-tab">
            <div className="settings-section">
              <h3>Notification Preferences</h3>
              <div className="settings-group">
                <label className="setting-item">
                  <input
                    type="checkbox"
                    name="emailNotifications"
                    checked={formData.preferences?.emailNotifications || false}
                    onChange={handleInputChange}
                  />
                  <span>Email notifications</span>
                </label>

                <label className="setting-item">
                  <input
                    type="checkbox"
                    name="pushNotifications"
                    checked={formData.preferences?.pushNotifications || false}
                    onChange={handleInputChange}
                  />
                  <span>Push notifications</span>
                </label>

                <label className="setting-item">
                  <input
                    type="checkbox"
                    name="weeklyDigest"
                    checked={formData.preferences?.weeklyDigest || false}
                    onChange={handleInputChange}
                  />
                  <span>Weekly progress digest</span>
                </label>
              </div>
            </div>

            <div className="settings-section">
              <h3>Privacy Settings</h3>
              <div className="settings-group">
                <label className="setting-item">
                  <input
                    type="checkbox"
                    name="publicProfile"
                    checked={formData.preferences?.publicProfile || false}
                    onChange={handleInputChange}
                  />
                  <span>Public profile</span>
                </label>

                <label className="setting-item">
                  <input
                    type="checkbox"
                    name="showProgress"
                    checked={formData.preferences?.showProgress || false}
                    onChange={handleInputChange}
                  />
                  <span>Show progress on leaderboard</span>
                </label>
              </div>
            </div>

            <div className="settings-actions">
              <button
                className="btn-primary"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
