import React from 'react';
import './Header.css';

function Header() {
  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">HSPACE</div>
        <nav className="nav">
          <a href="/" className="nav-link">NOTICE</a>
          <a href="/" className="nav-link">CALENDAR</a>
          <a href="/" className="nav-link">INTRODUCE</a>
          <a href="/" className="nav-link active">RESERVATION</a>
          <a href="/" className="nav-link">HISTORY</a>
          <a href="/" className="nav-link">EVENT</a>
        </nav>
      </div>
    </header>
  );
}

export default Header;
