import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './Header.css';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, login, logout } = useAuth();

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
          <button className="login-button" onClick={handleLogout}>
            로그아웃
          </button>
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
