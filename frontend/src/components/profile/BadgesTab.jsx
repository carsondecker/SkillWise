import React from 'react';
import '../../styles/components/Profile/BadgesTab.scss';

const BadgesTab = ({ badges }) => {
  return (
    <div className="badges-tab">
      <div className="badges-header">
        <div>
          <p className="eyebrow">Recognition</p>
          <h3>Badges & milestones</h3>
        </div>
        <span className="pill">{badges.filter((b) => b.earned).length} earned</span>
      </div>

      <div className="badges-grid">
        {badges.map((b) => (
          <div key={b.id} className={`badge-item ${b.earned ? 'earned' : 'locked'}`}>
            <div className="badge-icon">{b.icon}</div>
            <h4>{b.name}</h4>
            <p>{b.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BadgesTab;
