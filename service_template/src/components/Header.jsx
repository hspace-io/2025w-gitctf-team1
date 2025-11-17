import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { decodeJWT } from '../utils/jwt.js';
import { useEffect, useState } from 'react';
import './Header.css';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, login, logout } = useAuth();
  const [userAlias, setUserAlias] = useState('');

  useEffect(() => {
    if (isLoggedIn) {
      const token = localStorage.getItem('token');
      if (token) {
        const decoded = decodeJWT(token);
        if (decoded && decoded.alias) {
          setUserAlias(decoded.alias);
        }
      }
    } else {
      setUserAlias('');
    }
  }, [isLoggedIn]);

  const handleLogin = () => {
    navigate('/login');
  };

  const handleLogout = () => {
    logout();
  };

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname.startsWith('/recruiting');
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="top-nav">
      <div className="nav-left">
        <h1 className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          HSPACE
        </h1>
      </div>
      <div className="nav-center">
        <button
          className={`nav-link ${isActive('/club') ? 'active' : ''}`}
          onClick={() => navigate('/club')}
        >
          Club
        </button>
        <button
          className={`nav-link ${isActive('/recruiting') ? 'active' : ''}`}
          onClick={() => navigate('/recruiting')}
        >
          Recruiting
        </button>
      </div>
      <div className="nav-right">
        {isLoggedIn ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {userAlias && (
              <span 
                className="user-alias" 
                dangerouslySetInnerHTML={{ __html: userAlias }}
                style={{ color: '#fff', fontSize: '14px' }}
              />
            )}
            <button className="login-button" onClick={handleLogout}>
              로그아웃
            </button>
          </div>
        ) : (
          <button className="login-button" onClick={handleLogin}>
            로그인
          </button>
        )}
      </div>
    </nav>
  );
}

export default Header;
