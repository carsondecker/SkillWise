import React from 'react';
import '../../styles/components/Profile/SkillsTab.scss';

const skillsMock = [
  { name: 'React', level: 78, tone: '#38bdf8' },
  { name: 'Algorithms', level: 62, tone: '#a855f7' },
  { name: 'UI/UX', level: 70, tone: '#f59e0b' },
  { name: 'SQL', level: 54, tone: '#22c55e' },
];

const SkillsTab = () => {
  return (
    <div className="skills-tab">
      <div className="skills-header">
        <div>
          <p className="eyebrow">Skills</p>
          <h3>Strengths & focus areas</h3>
        </div>
        <span className="pill">Auto-tracked</span>
      </div>

      <div className="skills-grid">
        {skillsMock.map((skill) => (
          <div key={skill.name} className="skill-card">
            <div className="skill-top">
              <p className="label">{skill.name}</p>
              <p className="value">{skill.level}%</p>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${skill.level}%`, background: skill.tone }}
              />
            </div>
            <p className="hint">
              Keep practicing to push this above {Math.min(skill.level + 10, 100)}%.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkillsTab;
