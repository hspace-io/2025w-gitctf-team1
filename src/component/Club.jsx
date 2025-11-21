import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './club.css';

function Club() {
  const navigate = useNavigate();
  const { isLoggedIn, login, logout } = useAuth();
  const [selectedClub, setSelectedClub] = useState(null);

  // API 교체
  const clubs = [
    {
      id: 1,
      name: 'Pay1oad',
      description: '보안 및 해킹 기술을 연구하는 동아리입니다.',
      president: '김보안',
      members: [
        { name: '김보안', username: '@security_kim', tags: ["회장"]},
        { name: '이해킹', username: '@hacker_lee', tags: ['운영진']},
        { name: '박디버깅', username: '@debug_park', tags: ['부원']},
        { name: '최게임', username: '@gamer_choi', tags: ['부원']},
        { name: '정리버스', username: '@reverse_jung', tags: ['부원']},
      ],
    },
    {
      id: 2,
      name: 'I want to sleep',
      description: '잠 자고 싶어요',
      president: '홍웹',
      members: [
        { name: '홍웹', username: '@web_hong', tags: ['회장'] },
        { name: '강프론트', username: '@frontend_kang', tags: ['운영진'] },
        { name: '윤백엔드', username: '@backend_yoon', tags: ['부원'] },
        { name: '임풀스택', username: '@fullstack_lim', tags: ['부원'] },
        { name: '한디자인', username: '@design_han', tags: ['부원'] },
      ],
    },
    {
      id: 3,
      name: 'I want to go home',
      description: '집에 가고 싶어요',
      president: '송AI',
      members: [
        { name: '송AI', username: '@ai_song', tags: ['회장'] },
        { name: '조머신러닝', username: '@ml_cho', tags: ['부원'] },
      ],
    },
  ];

  const handleClubClick = (club) => {
    setSelectedClub(club);
  };

  const handleCloseDetail = () => {
    setSelectedClub(null);
  };

  return (
    <div className="club-container">
      <nav className="top-nav">
        <div className="nav-left">
          <h1 className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>HSPACE</h1>
        </div>
        <div className="nav-center">
          <button className="nav-link active">Club</button>
          <button className="nav-link" onClick={() => navigate('/')}>Recruiting</button>
        </div>
        <div className="nav-right">
          {isLoggedIn ? (
            <button className="login-button" onClick={logout}>
              로그아웃
            </button>
          ) : (
            <button className="login-button" onClick={login}>
              로그인
            </button>
          )}
        </div>
      </nav>

      <main className="club-main">
        <div className="club-header">
          <h2 className="club-title">Club</h2>
          <p className="club-subtitle">HSPACE 소속 동아리입니다.</p>
        </div>

        <div className="club-list">
          {clubs.map((club) => (
            <div
              key={club.id}
              className="club-card"
              onClick={() => handleClubClick(club)}
            >
              <div className="club-card-header">
                <h3 className="club-card-title">{club.name}</h3>
              </div>
              <p className="club-card-description">{club.description}</p>
              <div className="club-card-footer">
                <span className="club-member-count">부원 {club.members.length}명</span>
              </div>
            </div>
          ))}
        </div>
      </main>

      {selectedClub && (
        <div className="club-modal-overlay" onClick={handleCloseDetail}>
          <div className="club-modal" onClick={(e) => e.stopPropagation()}>
            <button className="club-modal-close" onClick={handleCloseDetail}>
              ×
            </button>
            <div className="club-modal-content">
              <h2 className="club-modal-title">{selectedClub.name}</h2>
              <p className="club-modal-description">{selectedClub.description}</p>
              
              <div className="club-members-list-container">
                {selectedClub.members.map((member, index) => (
                  <div key={index} className="club-member-item">
                    <div className="member-profile">
                      <div className="member-avatar">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="member-info">
                        <div className="member-name">{member.name}</div>
                        <div className="member-username">{member.username}</div>
                      </div>
                    </div>
                    <div className="member-tags">
                      {member.tags.map((tag, tagIndex) => {
                        const getTagClass = (tagName) => {
                          if (tagName === '회장') return 'tag-president';
                          if (tagName === '운영진') return 'tag-executive';
                          if (tagName === '부원') return 'tag-member';
                          return `tag-${tagName.toLowerCase()}`;
                        };
                        return (
                          <span key={tagIndex} className={`member-tag ${getTagClass(tag)}`}>
                            {tag}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Club;

