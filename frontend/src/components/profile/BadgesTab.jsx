import React from 'react';
import '../../styles/components/Profile/BadgesTab.scss';

const BadgesTab = ({ badges }) => {
  return (
    <div className="badges-tab">
      <h3>Badges</h3>

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
