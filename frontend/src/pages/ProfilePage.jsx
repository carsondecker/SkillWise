import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/api';
import OverviewTab from '../components/profile/OverviewTab';
import SkillsTab from '../components/profile/SkillsTab';
import BadgesTab from '../components/profile/BadgesTab';
import SettingsTab from '../components/profile/SettingsTab';
import '../styles/ProfilePage.scss';

const ProfilePage = () => {
  const [profileData, setProfileData] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { user } = useAuth();

  const fetchProfile = async () => {
    try {
      setLoading(true);

      const [profileRes, statsRes, progressRes, streaksRes] = await Promise.all([
        apiService.user.getProfile(),
        apiService.user.getStatistics(),
        apiService.progress.getLatestProgress(),
        apiService.streaks.getStreak(),
      ]);

      const userData = profileRes.data.user || profileRes.data;
      const statsData = statsRes.data.statistics || statsRes.data;
      const progressData = progressRes.data.latest || [];
      console.log(progressData);
      const streakData = streaksRes.data.streak || {};

      const fullProfile = {
        id: userData.id,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        avatar: userData.profileImage || null,
        bio: userData.bio || '',
        joinedDate: userData.createdAt || new Date().toISOString(),
        level: statsData.level || 1,
        totalPoints: Number(statsData.total_points || 0),
        completedChallenges: Number(statsData.total_challenges_completed || 0),
        longestStreak: Number(streakData.longest_streak || 0),
        goalsAchieved: Number(statsData.total_goals_completed || 0),
        badges: userData.badges || [],
      };

      setProfileData(fullProfile);

      const formattedActivity = progressData.map((p) => ({
        id: p.id,
        type: p.challengeId ? 'challenge' : p.goalId ? 'goal' : 'progress',
        title: p.challengeTitle || p.goalTitle || 'Progress Update',
        date: p.updatedAt || p.createdAt,
        points: p.pointsEarned || 0,
      }));

      setRecentActivity(formattedActivity);
    } catch (err) {
      console.error("❌ Profile fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchProfile();
  }, [user]);

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
              {profileData?.avatar ? (
                <img
                  src={process.env.REACT_APP_BACKEND_URL+""+profileData.avatar}
                  alt="Profile Avatar"
                  className="avatar-img"
                />
              ) : (
                <span className="avatar-placeholder">👤</span>
              )}
              <div className="level-badge">Level {profileData?.level}</div>
            </div>

            <div className="profile-details">
              <h1>
                {profileData?.firstName} {profileData?.lastName}
              </h1>
              <p className="profile-bio">{profileData?.bio || 'No bio yet.'}</p>
              <div className="profile-meta">
                <span>
                  📅 Joined{' '}
                  {new Date(profileData?.joinedDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="profile-stats">
              <div className="stat-item">
                <strong>{profileData?.totalPoints}</strong>
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

      {/* TAB CONTENT */}
      <div className="profile-content">
        {activeTab === 'overview' && (
          <OverviewTab profile={profileData} recentActivity={recentActivity} />
        )}
        {activeTab === 'skills' && <SkillsTab />}
        {activeTab === 'badges' && (
          <BadgesTab badges={profileData.badges} />
        )}
        {activeTab === 'settings' && (
          <SettingsTab profile={profileData} refreshProfile={() => fetchProfile()} />
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
