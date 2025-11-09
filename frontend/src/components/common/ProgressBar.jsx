import React from 'react';
import '../../styles/components/common/ProgressBar.scss';

const ProgressBar = ({ value = 0, label }) => {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="progress-component">
      {label && <div className="progress-label">{label}</div>}
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="progress-number">{pct}%</div>
    </div>
  );
};

export default ProgressBar;
