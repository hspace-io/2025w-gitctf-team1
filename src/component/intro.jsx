import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './intro.css';


function Intro() {
  const navigate = useNavigate();
  const { isLoggedIn, login, logout } = useAuth();
  
  const [recruitingPosts, setRecruitingPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // API 교체
  useEffect(() => {
    const fetchRecruitingPosts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/recruiting-posts?limit=5', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.warn('API가 아직 준비되지 않았습니다. 개발 모드에서는 빈 데이터를 사용합니다.');
          setRecruitingPosts([]);
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        setRecruitingPosts(data);
      } catch (err) {
        console.error('구인글 조회 실패:', err);
        
        if (err.message.includes('JSON') || err.message.includes('<!doctype')) {
          console.warn('API가 아직 준비되지 않았습니다. 개발 모드에서는 빈 데이터를 사용합니다.');
          setError(null);
          setRecruitingPosts([]);
        } else {
          setError(err.message || '구인글을 불러오는데 실패했습니다.');
          setRecruitingPosts([]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecruitingPosts();
  }, []);

  const getCategoryLabel = (category) => {
    const categoryMap = {
      'STUDY': '스터디',
      'CTF': 'CTF',
      'PROJECT': '프로젝트',
    };
    return categoryMap[category] || category;
  };

  const getDifficultyLabel = (difficulty) => {
    const difficultyMap = {
      'LOW': '초급',
      'MID': '중급',
      'HIGH': '고급',
    };
    return difficultyMap[difficulty] || difficulty;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const formatDateDot = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  const displayedPosts = recruitingPosts.slice(0, 5);

  const handleNavClick = (menu) => {
    if (menu === 'Club') {
      navigate('/club');
    } else if (menu === 'Recruiting') {
      console.log('Recruiting 메뉴 클릭');
    }
  };

  const handleLogin = () => {
    login();
    console.log('로그인 버튼 클릭');
  };

  const handleLogout = () => {
    logout();
    console.log('로그아웃 버튼 클릭');
  };

  return (
    <div className="intro-container">
      <nav className="top-nav">
        <div className="nav-left">
          <h1 className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>HSPACE</h1>
        </div>
        <div className="nav-center">
          <button className="nav-link" onClick={() => handleNavClick('Club')}>
            Club
          </button>
          <button className="nav-link" onClick={() => navigate('/')}>
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

      <main className="intro-main">
        {isLoggedIn && (
          <div className="profile-section">
            <div className="welcome-bubble">
              반가워요, JungWooJJING 님
            </div>
            <div className="profile-picture">
              <div className="profile-placeholder">
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="50" cy="50" r="40" fill="#667eea" opacity="0.3"/>
                  <circle cx="50" cy="35" r="12" fill="#667eea"/>
                  <ellipse cx="50" cy="65" rx="20" ry="15" fill="#667eea"/>
                </svg>
              </div>
            </div>
            <div className="user-email">cuby5577@gmail.com</div>
          </div>
        )}

        <div className="recruiting-section">
          <div className="recruiting-header">
            <h2 className="recruiting-title">HSPACE에 오신 것을 환영합니다</h2>
            <p className="recruiting-subtitle">함께 성장할 동료를 찾아보세요</p>
          </div>

          <div className="intro-description">
            <p>이곳에서 다양한 동아리원들과 함께 스터디, CTF, 프로젝트 등 다양한 활동을 함께할 수 있습니다.</p>
            <p>더 이상 혼자서 공부하지 말고 함께 성장하고 배워가는 동료를 찾아보세요.</p>
            <p>다양한 분야의 사람들과 함께 새로운 도전을 시작하세요.</p>
          </div>

          <div className="recruiting-list">
            {isLoading ? (
              <div className="loading-message">구인글을 불러오는 중...</div>
            ) : error ? (
              <div className="error-message">오류: {error}</div>
            ) : displayedPosts.length > 0 ? (
              displayedPosts.map((post) => (
                <div key={post.id} className="recruiting-card">
                  <div className="card-top">
                    <div className="card-tags">
                      <span className="card-tag">{getCategoryLabel(post.category)}</span>
                      <span className="card-tag">{post.field}</span>
                    </div>
                    <div className="card-views">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 2C4 2 1 5.5 1 8C1 10.5 4 14 8 14C12 14 15 10.5 15 8C15 5.5 12 2 8 2Z" stroke="currentColor" strokeWidth="1.5"/>
                        <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
                      </svg>
                      <span>0</span>
                    </div>
                  </div>
                  <div className="card-title-area">
                    {post.title.split('\n').map((line, index) => (
                      <h3 key={index} className="card-title">{line || post.title}</h3>
                    ))}
                  </div>
                  <div className="card-info">
                    <div className="info-item">
                      <span className="info-label">일시</span>
                      <span className="info-value">{formatDate(post.eventDate)}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">모집</span>
                      <span className="info-value">{post.recruitmentCount}명</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">난이도</span>
                      <span className="info-value">{getDifficultyLabel(post.difficulty)}</span>
                    </div>
                  </div>
                  <div className="card-bottom">
                    <span className="card-club">{post.clubName}</span>
                    <span className="card-date">{formatDateDot(post.createdAt)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-message">등록된 구인글이 없습니다.</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Intro;
