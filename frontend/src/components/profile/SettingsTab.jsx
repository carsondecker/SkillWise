import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import '../../styles/components/Profile/SettingsTab.scss';

const SettingsTab = ({ profile, refreshProfile }) => {
  const [editMode, setEditMode] = useState(false);

  const [formData, setFormData] = useState({
    firstName: profile.firstName || '',
    lastName: profile.lastName || '',
    bio: profile.bio || '',
  });

  const getAvatarUrl = (value) => {
    if (!value) return null;
    const base = process.env.REACT_APP_BACKEND_URL || '';
    return value.startsWith('http') ? value : `${base}${value}`;
  };

  const [avatarPreview, setAvatarPreview] = useState(getAvatarUrl(profile.avatar));
  const [avatarFile, setAvatarFile] = useState(null);

  useEffect(() => {
    setFormData({
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      bio: profile.bio || '',
    });
    setAvatarPreview(getAvatarUrl(profile.avatar));
    setAvatarFile(null);
    setEditMode(false);
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Instagram style: only allow avatar change in edit mode
  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file)); // Preview instantly
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Step 1 → Update profile text fields
      await apiService.user.updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        bio: formData.bio,
      });

      // Step 2 → Upload avatar (only if changed)
      if (avatarFile) {
        const fd = new FormData();
        fd.append('avatar', avatarFile);

        await apiService.user.updateAvatar(fd);
      }

      await refreshProfile();
      setEditMode(false);
    } catch (err) {
      console.error('❌ Profile update failed:', err);
    }
  };

  return (
    <div className="settings-tab">
      <div className="settings-header">
        <h3>Profile Settings</h3>

        {!editMode && (
          <button className="btn-edit" onClick={() => setEditMode(true)}>
            Edit Profile
          </button>
        )}
      </div>

      {/* VIEW MODE */}
      {!editMode && (
        <div className="settings-view">
          <div className="avatar-wrapper">
            {avatarPreview ? (
              <img src={avatarPreview} className="settings-avatar" alt="Profile avatar" />
            ) : (
              <div className="avatar-fallback">👤</div>
            )}
          </div>

          <div className="settings-section">
            <h4>Basic Info</h4>
            <p><strong>Name:</strong> {profile.firstName} {profile.lastName}</p>
            <p><strong>Email:</strong> {profile.email}</p>
            <p><strong>Bio:</strong> {profile.bio || 'No bio yet'}</p>
          </div>

          <div className="settings-actions">
            <button className="btn-secondary">Change Password</button>
            <button className="btn-danger">Delete Account</button>
          </div>
        </div>
      )}

      {/* EDIT MODE */}
      {editMode && (
        <form className="settings-edit" onSubmit={handleSubmit}>

          {/* INSTAGRAM STYLE PROFILE PICTURE CHANGE */}
          <div className="avatar-edit-container">
            <img src={avatarPreview} className="settings-avatar" />

            <label className="change-avatar-btn">
              Change Photo
              <input type="file" accept="image/*" onChange={handleAvatarSelect} hidden />
            </label>
          </div>

          <div className="settings-group">
            <label>First Name</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
            />
          </div>

          <div className="settings-group">
            <label>Last Name</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
            />
          </div>

          <div className="settings-group">
            <label>Bio</label>
            <textarea
              name="bio"
              rows="3"
              value={formData.bio}
              onChange={handleChange}
            />
          </div>

          <div className="settings-edit-actions">
            <button type="button" className="btn-secondary" onClick={() => setEditMode(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-save">Save Changes</button>
          </div>
        </form>
      )}
    </div>
  );
};

export default SettingsTab;
