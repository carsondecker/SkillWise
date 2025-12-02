// src/components/common/LoadingSpinner.jsx
import React from 'react';
import Lottie from 'lottie-react';
import loadingAnimation from '../../assets/animations/loading.json'; // 👈 You’ll add this file
import '../../styles/components/Common/LoadingSpinner.scss';

const LoadingSpinner = ({ size = 'medium', message = 'Loading...' }) => {
  const sizeMap = {
    small: 60,
    medium: 120,
    large: 180,
  };

  return (
    <div className="loading-spinner-container">
      <Lottie
        animationData={loadingAnimation}
        loop
        autoplay
        style={{ width: sizeMap[size], height: sizeMap[size] }}
      />
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
