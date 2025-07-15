import React from 'react';
import '../styles/Loader.css';

const Loader = ({ size = 'medium' }) => {
  const sizeClass = `loader-${size}`;
  
  return (
    <div className={`loader ${sizeClass}`}>
      <div className="loader-spinner"></div>
    </div>
  );
};

export default Loader;