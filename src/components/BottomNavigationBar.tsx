import React from 'react';
import './BottomNavigationBar.css';

const BottomNavigationBar: React.FC = () => {
  return (
    <nav className="mobile-bottom-bar">
      <button className="nav-item">
        <svg className="icon" viewBox="0 0 24 24">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
        </svg>
        <span>Início</span>
      </button>
      <button className="nav-item active">
        <svg className="icon" viewBox="0 0 24 24">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
        </svg>
        <span>Quadro</span>
      </button>
      <button className="nav-item">
        <svg className="icon" viewBox="0 0 24 24">
          <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
        </svg>
        <span>Mais</span>
      </button>
    </nav>
  );
};

export default BottomNavigationBar;